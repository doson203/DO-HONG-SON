import { GoogleGenAI, GenerateContentResponse, Modality, Type, HarmBlockThreshold, HarmCategory, FinishReason, GenerateImagesResponse } from "@google/genai";
import * as apiKeyService from './apiKeyService';
import { TechOptions, Prompts, Branch, ImageAnalysisMode, AspectRatio, YouTubeAnalysisType, VideoStoryboard, TtsVoice, TtsSpeakerConfig, VeoModel, VideoResolution, VideoAspectRatio, CreativityLevel, YouTubeScriptResult, Scene, StoryboardAudio } from "../types";
import { promptConfig, voiceOptions } from '../constants';

const getAiInstance = (): GoogleGenAI => {
    const apiKey = apiKeyService.getApiKey();
    if (!apiKey) {
        // This error should be caught by the UI and trigger the key input page.
        throw new Error("Mã API Google Gemini chưa được cấu hình.");
    }
    return new GoogleGenAI({ apiKey });
};

// A less restrictive safety setting to prevent false positives on harmless content.
const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

/**
 * Parses a Gemini API response to find a detailed error message.
 * @param response The GenerateContentResponse from the API.
 * @returns A detailed error string or null if no specific error is found.
 */
// FIX: Update function signature to accept GenerateImagesResponse for broader error handling.
const getErrorFromResponse = (response: GenerateContentResponse | GenerateImagesResponse): string | null => {
    // 1. Check for prompt feedback block reason (most specific)
    // FIX: Add type guard as 'promptFeedback' only exists on GenerateContentResponse.
    if ('promptFeedback' in response && response.promptFeedback?.blockReason) {
        let reason = `Yêu cầu đã bị chặn vì lý do an toàn (${response.promptFeedback.blockReason}). Điều này có thể xảy ra do các từ khóa trong prompt của bạn. Vui lòng thử diễn đạt lại ý tưởng của bạn.`;
        if (response.promptFeedback.blockReasonMessage) {
            reason += ` Chi tiết từ AI: ${response.promptFeedback.blockReasonMessage}`;
        }
        return reason;
    }

    // 2. Check for candidate finish reason (if it's not a normal stop)
    // FIX: Add type guard as 'candidates' only exists on GenerateContentResponse.
    if ('candidates' in response && response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const finishReason = candidate.finishReason;
        // FIX: Use FinishReason enum for comparison instead of string literals to fix type error.
        if (finishReason && finishReason !== FinishReason.STOP && finishReason !== FinishReason.FINISH_REASON_UNSPECIFIED && finishReason !== FinishReason.MAX_TOKENS) {
            let reason = `Yêu cầu đã bị dừng vì lý do an toàn (${finishReason}). Vui lòng thử diễn đạt lại ý tưởng của bạn.`;
            if (candidate.finishMessage) {
                reason += ` Chi tiết từ AI: ${candidate.finishMessage}`;
            }
            return reason;
        }
    }

    // 3. Check for any text feedback from the model (if it's not just empty code block)
    // FIX: Add type guard as 'text' only exists on GenerateContentResponse.
    if ('text' in response && response.text) {
        const textFeedback = response.text.trim();
        if (textFeedback && textFeedback !== '```' && textFeedback !== '```json') {
            return `Phản hồi của AI: "${textFeedback}"`;
        }
    }


    return null; // No specific error found
};


const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const generatePromptInstruction = (preferences: TechOptions, structure: object, coreIdea: string, theme: string): string => {
    let preferencesText = "";
    const chosenPreferences = Object.entries(preferences)
        .filter(([, value]) => value && value !== "Mặc định")
        .map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
        .join("\n");

    if (chosenPreferences) {
        preferencesText = `\n**User's Technical Preferences (IMPORTANT: You MUST follow these):**\n${chosenPreferences}\n`;
    }

    return `**User's Core Idea:** "${coreIdea}"
        **Contextual Theme:** "${theme}"
        You are an expert prompt engineer. Your task is to expand the user's simple idea into a detailed specification based on the theme.
        ${preferencesText}
        **Instructions:**
        1. Analyze the user's idea, contextual theme, and especially their technical preferences.
        2. Mentally fill out the JSON structure below with creative details that match all the inputs.
        3. Use ALL details from your mental model to write two rich, descriptive paragraphs (one Vietnamese, one English).
        4. The final paragraph MUST include a comprehensive negative prompt.
        
        **JSON Structure Guide:** ${JSON.stringify(structure, null, 2)}`;
};

const getPromptsFromResponse = (response: GenerateContentResponse): Prompts => {
    const text = response.text.trim();
    try {
        const parsed = JSON.parse(text);
        if (parsed.vietnamese && parsed.english) {
            return parsed as Prompts;
        }
    } catch (e) {
        console.error("Failed to parse JSON, returning raw text.", e);
    }
    // Fallback if JSON parsing fails
    return { vietnamese: text, english: text };
}

export const generatePromptsFromIdea = async (
    idea: string, 
    branch: Branch, 
    techOptions: TechOptions, 
    mode: ImageAnalysisMode // Re-using this type: 'freestyle' | 'focused'
): Promise<Prompts> => {
    const ai = getAiInstance();
    const responseConfig = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                vietnamese: { type: Type.STRING },
                english: { type: Type.STRING },
            },
            required: ["vietnamese", "english"],
        },
    };

    if (mode === 'focused') {
        const emptyStructure = {
            common: promptConfig.common,
            [branch]: promptConfig[branch]
        };
        const fullPrompt = generatePromptInstruction(techOptions, emptyStructure, idea, branch);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: { ...responseConfig, safetySettings },
        });
        return getPromptsFromResponse(response);

    } else { // freestyle mode
        let preferencesText = "";
        const chosenPreferences = Object.entries(techOptions)
            .filter(([, value]) => value && value !== "Mặc định")
            .map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
            .join("\n");

        if (chosenPreferences) {
            preferencesText = `\n**User's Technical Preferences (IMPORTANT: You MUST incorporate these into your description):**\n${chosenPreferences}\n`;
        }

        const freestylePrompt = `You are a creative expert and prompt engineer. Your task is to take the user's core idea and expand it into a single, rich, descriptive, and imaginative paragraph in English, suitable for an advanced AI image generation model. You have creative freedom but must respect the user's technical preferences if provided. Also, create a Vietnamese translation of the final English paragraph.

        **User's Core Idea:** "${idea}"
        ${preferencesText}
        
        **Instructions:**
        1. Brainstorm creative details related to the idea and preferences.
        2. Write the final English prompt as a single, detailed paragraph.
        3. Provide a faithful Vietnamese translation of that English prompt.
        4. Include a comprehensive negative prompt suggestion within the English prompt using a standard format like '--neg ...' or 'Negative prompt: ...' at the end.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: freestylePrompt,
            config: { ...responseConfig, safetySettings },
        });
        return getPromptsFromResponse(response);
    }
};

export const analyzeImage = async (imageFile: File, mode: ImageAnalysisMode, techOptions: TechOptions): Promise<Prompts> => {
    const ai = getAiInstance();
    const imagePart = await fileToGenerativePart(imageFile);

    const finalPromptConfig = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                vietnamese: { type: Type.STRING },
                english: { type: Type.STRING },
            },
            required: ["vietnamese", "english"],
        },
    };

    if (mode === 'freestyle') {
        let mainInstruction = `You are an expert image analyst and prompt engineer. Your task is to analyze a user's image and describe it in extreme detail to create a high-quality generation prompt. Focus on objective details: subject, composition, lighting, style, color palette, and any specific artistic techniques.`;
        
        let preferencesText = "";
        const chosenPreferences = Object.entries(techOptions)
            .filter(([, value]) => value && value !== "Mặc định")
            .map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
            .join("\n");

        if (chosenPreferences) {
            preferencesText = `\n**User's Technical Preferences (IMPORTANT: You MUST creatively reinterpret the image according to these):**\n${chosenPreferences}\n`;
        }
        
        const fullPrompt = `${mainInstruction}\n${preferencesText}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: fullPrompt }] },
            config: { ...finalPromptConfig, safetySettings },
        });

        return getPromptsFromResponse(response);

    } else { // focused mode
        const categoryKeys = Object.keys(promptConfig).filter(k => k !== 'common') as Branch[];
        const classificationPrompt = `Analyze the image and classify it into one of the following categories: ${categoryKeys.join(', ')}.`;
        
        const classificationResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: classificationPrompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        category: { 
                            type: Type.STRING,
                            enum: categoryKeys,
                        },
                    },
                    required: ["category"],
                },
                safetySettings,
            },
        });

        const classificationResult = JSON.parse(classificationResponse.text);
        const category = classificationResult.category as Branch;

        if (!category || !promptConfig[category]) {
            throw new Error(`Could not classify the image. AI returned: ${classificationResponse.text}`);
        }
        
        const focusedStructure = {
            common: promptConfig.common,
            [category]: promptConfig[category]
        };

        let preferencesText = "";
        const chosenPreferences = Object.entries(techOptions)
            .filter(([, value]) => value && value !== "Mặc định")
            .map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
            .join("\n");

        if (chosenPreferences) {
            preferencesText = `\n**User's Technical Preferences (IMPORTANT: You MUST creatively reinterpret the image according to these):**\n${chosenPreferences}\n`;
        }

        const generationPrompt = `You are an expert image analyst. The image has been classified as **${category}**. 
        Your task is to perform a deep, structured analysis based ONLY on that category's specific JSON schema to generate a rich, descriptive prompt.
        ${preferencesText}
        **JSON Structure for Analysis:**
        ${JSON.stringify(focusedStructure, null, 2)}`;
    
        const finalResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: generationPrompt }] },
            config: { ...finalPromptConfig, safetySettings },
        });

        return getPromptsFromResponse(finalResponse);
    }
};


export const generateImageFromPrompts = async (prompts: Prompts, numberOfImages: number, aspectRatio: AspectRatio): Promise<string[]> => {
    const ai = getAiInstance();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompts.english,
        config: {
            numberOfImages: numberOfImages,
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio,
        },
        safetySettings,
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages.map(img => img.image.imageBytes);
    }
    const detailedError = getErrorFromResponse(response);
    if (detailedError) {
        throw new Error(`AI không tạo ra hình ảnh. ${detailedError}`);
    }
    throw new Error('AI không trả về hình ảnh. Yêu cầu của bạn có thể đã bị từ chối vì một lý do không xác định. Vui lòng thử lại với một yêu cầu khác.');
};

export const editImage = async (
    subjectImage: File,
    customPrompt: string,
    aspectRatio: AspectRatio,
    variationIndex?: number
): Promise<string> => {
    const ai = getAiInstance();
    const baseInstruction = `You are an expert AI image editor. Your primary and most critical task is to produce an image with the **EXACT aspect ratio of ${aspectRatio}**.

**ABSOLUTE RULES:**
1.  **ASPECT RATIO FIRST:** Before any other modification, you MUST ensure the final canvas has a strict ${aspectRatio} aspect ratio. To achieve this, you must intelligently CROP the original image or creatively EXTEND the scene (outpainting). You are FORBIDDEN from stretching, distorting, squashing the image, or adding letterbox/pillarbox bars. This is the top priority.
2.  **USER REQUEST:** Once the aspect ratio is guaranteed, apply the user's edit request: "${customPrompt}".
3.  **MAINTAIN QUALITY:** The final result must be a high-quality, photorealistic masterpiece. All edits must blend seamlessly.
`;
    let promptText = baseInstruction;
    
    if (variationIndex && variationIndex > 0) {
         promptText = `${promptText}\n--variation ${variationIndex + Math.random()}`;
    }

    const subjectPart = await fileToGenerativePart(subjectImage);
    
    const parts: any[] = [
        { text: promptText },
        subjectPart
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: {
            responseModalities: [Modality.IMAGE],
            safetySettings,
        },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
    }

    const detailedError = getErrorFromResponse(response);
    if (detailedError) {
        throw new Error(`AI không tạo ra hình ảnh. ${detailedError}`);
    }
    
    throw new Error('AI không trả về hình ảnh. Yêu cầu của bạn có thể đã bị từ chối vì một lý do không xác định. Vui lòng thử lại với một yêu cầu khác.');
};

export const restorePhoto = async (
    image: File,
    options: {
        mode: 'single' | 'multiple';
        gender?: string;
        age?: string;
        description?: string;
    }
): Promise<string> => {
    const ai = getAiInstance();
    const imagePart = await fileToGenerativePart(image);
    
    let basePrompt = `You are a master AI photo restorer. Your task is to restore this old photograph to pristine, masterpiece quality. 
CRITICAL INSTRUCTIONS:
1.  **Restore:** Fix all scratches, tears, folds, and discoloration.
2.  **Enhance:** Drastically improve clarity, sharpness, and fine details, aiming for a hyper-realistic result.
3.  **Preserve:** Do not colorize the photo unless the original colors are obvious. The output MUST have the exact same aspect ratio as the input. Do not crop, stretch, or alter the original composition in any way.
`;
    
    let contextPrompt = "";
    if (options.mode === 'single') {
        contextPrompt = `\nThe photo contains a single person. Here are some details to help you restore the face and features accurately:`;
        if (options.gender) contextPrompt += `\n- Gender: ${options.gender}`;
        if (options.age) contextPrompt += `\n- Estimated Age: ${options.age}`;
        if (options.description) contextPrompt += `\n- Additional Description: ${options.description}`;
    } else if (options.mode === 'multiple' && options.description) {
        contextPrompt = `\nThe photo contains multiple people. Here is a general description of the scene to guide the restoration: ${options.description}`;
    }

    const prompt = basePrompt + contextPrompt;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            responseModalities: [Modality.IMAGE],
            safetySettings,
        },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
    }

    const detailedError = getErrorFromResponse(response);
    if (detailedError) {
        throw new Error(`AI đã không khôi phục ảnh. ${detailedError}`);
    }

    throw new Error('AI không trả về hình ảnh để khôi phục. Yêu cầu của bạn có thể đã bị từ chối vì một lý do không xác định. Vui lòng thử lại.');
};

const resizeImageFile = (file: File, maxSize: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            const { width, height } = img;

            if (width <= maxSize && height <= maxSize) {
                return resolve(file);
            }

            let newWidth, newHeight;
            if (width > height) {
                newWidth = maxSize;
                newHeight = (height * maxSize) / width;
            } else {
                newHeight = maxSize;
                newWidth = (width * maxSize) / height;
            }

            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));
            
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas toBlob failed'));
                const resizedFile = new File([blob], file.name, {
                    type: 'image/png',
                    lastModified: Date.now(),
                });
                resolve(resizedFile);
            }, 'image/png', 0.95);
        };
        img.onerror = (error) => {
            URL.revokeObjectURL(img.src);
            reject(error);
        };
    });
};

export const upscaleImage = async (
    image: File
): Promise<string> => {
    const ai = getAiInstance();
    const imageToProcess = await resizeImageFile(image, 1024);

    const imagePart = await fileToGenerativePart(imageToProcess);
    const prompt = `You are an expert AI image upscaler. Your task is to upscale this image to a higher resolution, creating a masterpiece. 
CRITICAL INSTRUCTIONS:
1.  **Upscale & Enhance:** Drastically enhance its details, clarity, and sharpness.
2.  **Preserve:** Perfectly preserve the original artistic style and content. Do not add, remove, or change any elements. The goal is a high-quality, hyper-detailed, larger version.
3.  **Aspect Ratio:** The output image MUST have the exact same aspect ratio as the input image. Do not crop it.
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            responseModalities: [Modality.IMAGE],
            safetySettings,
        },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
    }
    
    const detailedError = getErrorFromResponse(response);
    if (detailedError) {
        throw new Error(`AI đã không upscale ảnh. ${detailedError}`);
    }

    throw new Error('AI không trả về hình ảnh đã upscale. Yêu cầu của bạn có thể đã bị từ chối vì một lý do không xác định. Vui lòng thử lại.');
};

export const compositeCharacters = async (
    characters: { file: File; originalIndex: number }[],
    backgroundFile: File | null,
    description: string,
    aspectRatio: AspectRatio
): Promise<string> => {
    const ai = getAiInstance();
    const parts: any[] = [];
    
    const promptText = `**PRIMARY TASK:** You are an expert AI photo compositor. Your most critical objective is to produce a final image with the **EXACT aspect ratio of ${aspectRatio}**.

**ABSOLUTE RULES & WORKFLOW:**
1.  **ESTABLISH CANVAS (CRITICAL):** Your first step is to establish the final image canvas with a strict ${aspectRatio} aspect ratio.
    *   If a 'BACKGROUND' image is provided, you MUST intelligently CROP or EXTEND it to fit this ratio perfectly.
    *   If no 'BACKGROUND' is provided, you MUST imagine and create a new scene that inherently has this ratio.
    *   You are FORBIDDEN from stretching, distorting, squashing images, or adding letterbox/pillarbox bars. This rule is non-negotiable.

2.  **IDENTIFY SUBJECTS:** The images labeled 'CHARACTER' contain the people you must use. You MUST preserve their faces and identities as accurately as possible. The user's description will refer to them by these numbers (e.g., "Character 1", "Character 5").

3.  **COMPOSITION & INTEGRATION:** Arrange the identified characters within your correctly-ratioed scene according to the user's description. This is the most critical artistic step. You must ensure the final composition is seamless, photorealistic, and high-quality. Lighting, shadows, and perspective must be consistent across all elements.

4.  **GENERATE:** Produce a single, stunning image that fulfills all the above criteria.
    
**USER DESCRIPTION:** "${description}"`;

    parts.push({ text: promptText });

    for (const char of characters) {
        parts.push({ text: `CHARACTER ${char.originalIndex}` });
        parts.push(await fileToGenerativePart(char.file));
    }
    
    if (backgroundFile) {
        parts.push({ text: 'BACKGROUND' });
        parts.push(await fileToGenerativePart(backgroundFile));
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts },
        config: {
            responseModalities: [Modality.IMAGE],
            safetySettings,
        },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
    }

    const detailedError = getErrorFromResponse(response);
    if (detailedError) {
        throw new Error(`AI đã không ghép ảnh. ${detailedError}`);
    }

    throw new Error('AI không trả về hình ảnh đã ghép. Yêu cầu của bạn có thể đã bị từ chối vì một lý do không xác định. Vui lòng thử lại.');
};

export const generateVideo = async (
    prompt: string,
    inputImage: File | null,
    numberOfVideos: number,
    model: VeoModel,
    resolution: VideoResolution,
    aspectRatio: VideoAspectRatio,
    onProgress: (message: string) => void
): Promise<string[]> => {
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        onProgress("Vui lòng chọn Mã API để tiếp tục...");
        await window.aistudio.openSelectKey();
    }
    const ai = getAiInstance();
    const apiKey = apiKeyService.getApiKey();
    if (!apiKey) {
        throw new Error("Mã API không khả dụng để tạo video.");
    }
    
    const generationPromises = Array.from({ length: numberOfVideos }, async (_, i) => {
        onProgress(`Bắt đầu tạo Video ${i + 1}/${numberOfVideos}...`);
        
        const requestPayload: any = {
            model: model,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: resolution,
                aspectRatio: aspectRatio,
            }
        };

        if (inputImage) {
            const imagePart = await fileToGenerativePart(inputImage);
            requestPayload.image = {
                imageBytes: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType,
            };
        }

        let operation = await ai.models.generateVideos(requestPayload);
        let attempts = 0;
        
        while (!operation.done) {
            onProgress(`Video ${i + 1}/${numberOfVideos} đang được xử lý... (lần kiểm tra thứ ${++attempts})`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            try {
                 operation = await ai.operations.getVideosOperation({ operation: operation });
            } catch (e: any) {
                if (e.message?.includes('Requested entity was not found')) {
                    throw new Error("Lỗi xác thực VEO: Mã API của bạn có thể không hợp lệ hoặc không có quyền truy cập. Vui lòng chọn lại Mã API và thử lại.");
                }
                throw e; // Re-throw other errors
            }
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error(`Không tìm thấy link tải cho Video ${i + 1}.`);
        }
        
        onProgress(`Đang tải xuống Video ${i + 1}/${numberOfVideos}...`);
        const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!videoResponse.ok) {
            throw new Error(`Không thể tải video ${i+1} từ link: ${videoResponse.statusText}`);
        }
        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);
    });

    return Promise.all(generationPromises);
};

export const analyzeYouTubeChannel = async (channelUrl: string, analysisType: YouTubeAnalysisType, onProgress: (message: string) => void): Promise<string> => {
    const ai = getAiInstance();
    onProgress('Đang chuẩn bị phân tích...');
    
    const prompt = `You are a world-class YouTube channel analyst. Perform a detailed analysis of the channel found at this URL: ${channelUrl}. Your analysis type is: "${analysisType}".
    
    Instructions:
    1.  Assume you have full access to the channel's video transcripts, titles, descriptions, and comment sections.
    2.  Provide your analysis in well-structured Vietnamese Markdown.
    3.  Be insightful, actionable, and provide specific examples from the channel to back up your points.
    
    Analysis type guidance:
    -   swot: Strengths, Weaknesses, Opportunities, Threats.
    -   content_strategy: Analyze the core topics, video formats, target audience, and overall content pillar. Suggest improvements.
    -   audience_engagement: Analyze comment sentiment, recurring themes in discussions, and how the creator interacts with their audience.
    -   growth_opportunities: Suggest new video ideas, collaboration opportunities, and potential new content formats or series based on the channel's niche.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { safetySettings },
    });
    
    onProgress('Phân tích hoàn tất!');
    return response.text;
};

export const generateVideoStoryboard = async (topic: string, duration: number, language: string): Promise<VideoStoryboard> => {
    const ai = getAiInstance();
    const prompt = `Create a video storyboard. Topic: "${topic}". Target duration: ${duration} seconds. Language for narration and descriptions: ${language}.
    
    The output must be a JSON object with this exact structure:
    {
      "title": "A short, catchy title",
      "logline": "A one-sentence summary of the video",
      "scenes": [
        {
          "scene": 1,
          "description": "Visual description of the scene.",
          "narration": "The narration or dialogue for this scene.",
          "prompt": "A detailed English prompt for an AI image/video generator to create this scene's visual."
        }
      ]
    }
    
    Base the number of scenes on the target duration. A ${duration}-second video should have roughly ${Math.max(2, Math.round(duration / 5))} scenes.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    logline: { type: Type.STRING },
                    scenes: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                scene: { type: Type.NUMBER },
                                description: { type: Type.STRING },
                                narration: { type: Type.STRING },
                                prompt: { type: Type.STRING },
                            },
                            required: ["scene", "description", "narration", "prompt"],
                        }
                    }
                },
                required: ["title", "logline", "scenes"]
            },
            safetySettings,
        },
    });

    return JSON.parse(response.text);
};

export const generateSpeech = async (text: string, voice: TtsVoice, style: string): Promise<string> => {
    const ai = getAiInstance();
    const prompt = style ? `Đọc theo phong cách ${style}: ${text}` : text;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
            safetySettings,
        },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
        throw new Error("Không nhận được dữ liệu âm thanh từ API.");
    }
    return audioBase64;
};


export const cloneStory = async (originalStory: string, creativity: CreativityLevel, storyTwists: string, storyCharacterCount: string): Promise<string> => {
    const ai = getAiInstance();
    let prompt = `You are a master storyteller. Your task is to rewrite the following story.

**Original Story:**
"""
${originalStory}
"""

**Instructions:**
-   **Creativity Level:** ${creativity}.
    -   faithful: Adhere closely to the original plot, characters, and themes. The changes should be stylistic or minor.
    -   balanced: Keep the core characters and themes, but feel free to change the plot significantly.
    -   creative: Use the original story only as a loose inspiration. Create a new story with new characters and plot.
-   **Emotions & Twists (if provided):** ${storyTwists || 'decide for me'}. Inject these emotional themes or surprising plot twists into the new story.
-   **Number of Characters (if provided):** ${storyCharacterCount || 'decide for me'}. The new story should feature this many main characters.

Rewrite the story according to these instructions. The output should be the full text of the new story in Vietnamese.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { safetySettings }
    });
    return response.text;
};

export const generateYouTubeScript = async (topic: string): Promise<YouTubeScriptResult> => {
    const ai = getAiInstance();
    const prompt = `You are an expert Vietnamese YouTube scriptwriter specializing in the style of channels like "Tâm Sự Cùng Vân Sâm". Your task is to write a complete YouTube video package based on the user's topic.

**Topic:** ${topic}

**Output Requirements:**
You MUST return a single JSON object with the following structure:
{
  "titles": ["Three compelling, emotional, click-worthy titles in Vietnamese"],
  "hook": "A 15-25 second captivating hook in Vietnamese to grab the viewer's attention immediately.",
  "descriptions": ["Two different YouTube video descriptions in Vietnamese, including relevant keywords."],
  "thumbnail_captions": ["Three short, dramatic text captions for the video thumbnail in Vietnamese."],
  "story_parts": [
    "Part 1: The beginning of the story, introducing the characters and conflict.",
    "Part 2: The conflict escalates.",
    "Part 3: A turning point or a major event.",
    "Part 4: The consequences of the turning point.",
    "Part 5: The climax of the story.",
    "Part 6: The resolution of the conflict.",
    "Part 7: The moral of the story and a concluding message for the audience."
  ]
}

Ensure the story is emotional, dramatic, and provides a valuable life lesson. All text must be in Vietnamese.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    titles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    hook: { type: Type.STRING },
                    descriptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    thumbnail_captions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    story_parts: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["titles", "hook", "descriptions", "thumbnail_captions", "story_parts"],
            },
            safetySettings,
        }
    });

    return JSON.parse(response.text);
};


export const generateSpeechFromStoryboard = async (storyboard: VideoStoryboard, voice: TtsVoice): Promise<StoryboardAudio[]> => {
    const speechPromises = storyboard.scenes.map(scene => 
        generateSpeech(scene.narration, voice, '')
            .then(audioBase64 => ({ scene: scene.scene, audioBase64 }))
            .catch(error => {
                console.error(`Failed to generate speech for scene ${scene.scene}:`, error);
                return { scene: scene.scene, audioBase64: '' }; // Return empty on error
            })
    );
    const results = await Promise.all(speechPromises);
    return results.filter(r => r.audioBase64).map(r => ({...r, url: ''})); // url will be added in component
};


// The following functions are placeholders or require more complex logic
export const generateStoryboardFromVideo = async (videoFile: File, duration: number, language: string, onProgress: (message: string) => void): Promise<VideoStoryboard> => {
    onProgress("Phân tích video... (Tính năng này đang được phát triển)");
    // In a real scenario, this would involve a multimodal model that can process video.
    // For now, we'll simulate by creating a basic storyboard.
    await new Promise(res => setTimeout(res, 1500));
    return {
        title: `Phân tích từ video: ${videoFile.name}`,
        logline: `Đây là kịch bản được tạo ra từ việc phân tích video được cung cấp.`,
        scenes: [{
            scene: 1,
            description: "Tính năng phân tích video và tạo kịch bản tiếp theo hiện chưa được hỗ trợ đầy đủ trong phiên bản này.",
            narration: "Vui lòng sử dụng chế độ 'Từ Chủ đề' hoặc 'Kịch bản & Phong cách' để tạo storyboard.",
            prompt: "a placeholder image indicating a feature is under development"
        }]
    };
};
export const generateStoryboardFromScript = async (script: string, duration: number, language: string, onProgress: (message: string) => void, videoFile: File | null): Promise<VideoStoryboard> => {
    const ai = getAiInstance();
    onProgress("Đang phân tích kịch bản...");
    
    let prompt = `Based on the provided script, generate a video storyboard. Target duration: ${duration} seconds. Language: ${language}.
    The AI should break down the script into logical scenes. For each scene, provide a visual description and a detailed English prompt for an AI image/video generator.
    
    Provided Script:
    """
    ${script}
    """
    
    The output must be a JSON object with this exact structure:
    {
      "title": "A title based on the script",
      "logline": "A one-sentence summary of the script",
      "scenes": [
        {
          "scene": 1,
          "description": "Visual description of the scene from the script.",
          "narration": "The narration or dialogue from the script for this scene.",
          "prompt": "A detailed English prompt for an AI image/video generator to create this scene's visual."
        }
      ]
    }`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    logline: { type: Type.STRING },
                    scenes: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                scene: { type: Type.NUMBER },
                                description: { type: Type.STRING },
                                narration: { type: Type.STRING },
                                prompt: { type: Type.STRING },
                            },
                            required: ["scene", "description", "narration", "prompt"],
                        }
                    }
                },
                required: ["title", "logline", "scenes"]
            },
            safetySettings,
        },
    });

    return JSON.parse(response.text);
};


export const generateDialogueSpeech = async (
    text: string, 
    speakers: TtsSpeakerConfig[], 
    onProgress: (message: string) => void
): Promise<{ speaker: string; audioBase64: string }[]> => {
    const ai = getAiInstance();
    onProgress("Phân tích kịch bản hội thoại...");

    const speakerConfigs = speakers.map(s => ({
        speaker: s.name,
        voiceConfig: {
            prebuiltVoiceConfig: { voiceName: s.voice }
        }
    }));

    const prompt = `TTS the following conversation between ${speakers.map(s => s.name).join(' and ')}:\n${text}`;
    
    onProgress("Đang tạo âm thanh hội thoại...");
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: speakerConfigs
                }
            },
            safetySettings,
        }
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
        throw new Error("Không nhận được dữ liệu âm thanh hội thoại từ API.");
    }

    // The API returns a single merged audio file. We return it as a single part to match the app's expectation of an array.
    return [{ speaker: 'dialogue', audioBase64 }];
};

export const cloneVoice = async (sourceAudio: File, text: string, onProgress: (message: string) => void): Promise<string> => {
    onProgress("Đang xử lý...");
    // This is a placeholder as direct voice cloning from an audio file is not a standard feature of the public Gemini API yet.
    // In a real-world scenario, this would call a specialized API endpoint.
    await new Promise(res => setTimeout(res, 1000));
    throw new Error("Tính năng Sao chép Giọng nói hiện chưa được hỗ trợ trong phiên bản này. Vui lòng thử lại sau.");
};
