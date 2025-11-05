
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Tabs from './components/Tabs';
import IdeaTab from './components/IdeaTab';
import ImageTab from './components/ImageTab';
import AIGenTab from './components/AIGenTab';
import RestoreTab from './components/RestoreTab';
import UpscaleTab from './components/UpscaleTab';
import VideoTab from './components/VideoTab';
import CharacterCompositingTab from './components/CharacterCompositingTab';
import YouTubeAnalysisTab from './components/YouTubeAnalysisTab';
import YouTubeDownloaderTab from './components/YouTubeDownloaderTab'; // New
import VideoStoryboardTab from './components/VideoStoryboardTab';
import StoryCloningTab from './components/StoryCloningTab'; // New
import YouTubeScriptTab from './components/YouTubeScriptTab'; // New
import TtsTab from './components/TtsTab';
import VoiceCloningTab from './components/VoiceCloningTab'; // New
import OutputSection from './components/OutputSection';
import Footer from './components/Footer';
import VideoEditorModal from './components/VideoEditorModal'; // Import the new component
import { Tab, TechOptions, Branch, Prompts, ImageAnalysisMode, ImageOutput, CreateImageSubTab, ProcessOldImageSubTab, AspectRatio, YouTubeAnalysisType, VideoStoryboard, StoryboardAudio, TtsVoice, TtsChunkOutput, VideoStoryboardInputMode, TtsMode, TtsSpeakerConfig, VeoModel, VideoResolution, VideoAspectRatio, CreativityLevel, YouTubeScriptResult } from './types';
import * as geminiService from './services/geminiService';
import { ApiKeyStatus } from './services/apiKeyService'; // Import the new type

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

interface AppProps {
  authType: 'owner' | 'guest' | 'user';
  onLogout: () => void;
  onInvalidApiKey: () => void;
  apiKeyStatus: ApiKeyStatus; // Receive the full status object
  onUpdatePremiumStatus: (status: 'yes' | 'no') => void; // Receive the updater function
}


// Helper function to get the closest standard aspect ratio from a file
const getImageAspectRatio = (file: File): Promise<Exclude<AspectRatio, 'auto'>> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            URL.revokeObjectURL(img.src);

            const ratios: { name: Exclude<AspectRatio, 'auto'>; value: number }[] = [
                { name: '1:1', value: 1 },
                { name: '16:9', value: 16 / 9 },
                { name: '9:16', value: 9 / 16 },
                { name: '4:3', value: 4 / 3 },
                { name: '3:4', value: 3 / 4 },
            ];

            // Find the ratio with the smallest difference
            const closest = ratios.reduce((prev, curr) => 
                (Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) ? curr : prev)
            );
            resolve(closest.name);
        };
        img.onerror = (err) => {
            URL.revokeObjectURL(img.src);
            reject(err);
        };
        img.src = URL.createObjectURL(file);
    });
};

const decodeBase64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const createWavBlobFromPcm = (pcmBytes: Uint8Array): Blob => {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = pcmBytes.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    // RIFF chunk descriptor
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
    view.setUint16(32, numChannels * (bitsPerSample / 8), true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write PCM data
    for (let i = 0; i < dataSize; i++) {
        view.setUint8(44 + i, pcmBytes[i]);
    }

    return new Blob([view], { type: 'audio/wav' });
};


const App: React.FC<AppProps> = ({ authType, onLogout, onInvalidApiKey, apiKeyStatus, onUpdatePremiumStatus }) => {
    // Shared State
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Đang tạo kiệt tác...');
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('ai_gen');
    
    // Sub-tab State
    const [createImageSubTab, setCreateImageSubTab] = useState<CreateImageSubTab>('idea');
    const [processImageSubTab, setProcessImageSubTab] = useState<ProcessOldImageSubTab>('restore');
    const [youtubeSubTab, setYoutubeSubTab] = useState<'analysis' | 'downloader'>('analysis');

    // Output State
    const [prompts, setPrompts] = useState<Prompts | null>(null);
    const [imageHistory, setImageHistory] = useState<ImageOutput[]>([]);
    const [videoPromptOutput, setVideoPromptOutput] = useState<string | null>(null);
    const [generatedVideoUrls, setGeneratedVideoUrls] = useState<string[]>([]);
    const [youtubeAnalysisResult, setYoutubeAnalysisResult] = useState<string | null>(null);
    const [videoStoryboardResult, setVideoStoryboardResult] = useState<VideoStoryboard | null>(null);
    const [storyboardAudio, setStoryboardAudio] = useState<StoryboardAudio[] | null>(null);
    const [ttsChunkOutputs, setTtsChunkOutputs] = useState<TtsChunkOutput[] | null>(null);
    const [clonedVoiceOutputUrl, setClonedVoiceOutputUrl] = useState<string | null>(null);
    const [clonedStoryOutput, setClonedStoryOutput] = useState<string | null>(null); // New
    const [youtubeScriptResult, setYoutubeScriptResult] = useState<YouTubeScriptResult | null>(null); // New
    const [isOutputVisible, setIsOutputVisible] = useState(true);

    // Video Editor State
    const [videoToEdit, setVideoToEdit] = useState<{ url: string; index: number } | null>(null);
    

    // --- Tab-specific State ---
    // CreateImageTab -> IdeaTab
    const [idea, setIdea] = useState('');
    const [ideaInputMode, setIdeaInputMode] = useState<'idea' | 'direct'>('idea');
    const [directPrompt, setDirectPrompt] = useState('');
    const [ideaAnalysisMode, setIdeaAnalysisMode] = useState<ImageAnalysisMode>('focused');
    const [selectedBranch, setSelectedBranch] = useState<Branch>('modern_human');
    const [techOptions, setTechOptions] = useState<TechOptions>({});
    
    // CreateImageTab -> ImageTab
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [analysisMode, setAnalysisMode] = useState<ImageAnalysisMode>('freestyle');

    // AIGenTab
    const [subjectImageFile, setSubjectImageFile] = useState<File | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    
    // ProcessOldImageTab -> RestoreTab
    const [restoreImageFile, setRestoreImageFile] = useState<File | null>(null);
    const [restoreMode, setRestoreMode] = useState<'single' | 'multiple'>('single');
    const [restoreGender, setRestoreGender] = useState<'male' | 'female' | ''>('');
    const [restoreAge, setRestoreAge] = useState('');
    const [restoreDescription, setRestoreDescription] = useState('');

    // ProcessOldImageTab -> UpscaleTab
    const [upscaleImageFile, setUpscaleImageFile] = useState<File | null>(null);

    // CharacterCompositingTab
    const [characterImages, setCharacterImages] = useState<File[]>([]);
    const [selectedCharacterIndices, setSelectedCharacterIndices] = useState<number[]>([]);
    const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
    const [compositingDescription, setCompositingDescription] = useState('');

    // VideoTab (New VEO 3 specific state)
    const [veoPrompt, setVeoPrompt] = useState('');
    const [veoInputImage, setVeoInputImage] = useState<File | null>(null);
    const [veoModel, setVeoModel] = useState<VeoModel>('veo-3.1-fast-generate-preview');
    const [videoResolution, setVideoResolution] = useState<VideoResolution>('720p');
    const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>('16:9');
    
    // YouTubeAnalysisTab
    const [youtubeChannelUrl, setYoutubeChannelUrl] = useState('');
    const [youtubeAnalysisType, setYoutubeAnalysisType] = useState<YouTubeAnalysisType>('swot');

    // VideoStoryboardTab
    const [videoStoryboardInputMode, setVideoStoryboardInputMode] = useState<VideoStoryboardInputMode>('topic');
    const [videoStoryboardTopic, setVideoStoryboardTopic] = useState('');
    const [videoStoryboardDuration, setVideoStoryboardDuration] = useState(15);
    const [storyboardVideoFile, setStoryboardVideoFile] = useState<File | null>(null);
    const [storyboardScript, setStoryboardScript] = useState('');
    const [storyboardLanguage, setStoryboardLanguage] = useState<string>('vi');
    const [storyboardVoice, setStoryboardVoice] = useState<TtsVoice>('Kore');

    // StoryCloningTab (New)
    const [originalStory, setOriginalStory] = useState('');
    const [creativityLevel, setCreativityLevel] = useState<CreativityLevel>('balanced');
    const [storyTwists, setStoryTwists] = useState(''); // Formerly newGenre
    const [storyCharacterCount, setStoryCharacterCount] = useState(''); // Formerly newSetting

    // YouTubeScriptTab (New)
    const [youtubeScriptTopic, setYoutubeScriptTopic] = useState('');
    
    // TtsTab
    const [ttsMode, setTtsMode] = useState<TtsMode>('single');
    const [ttsSpeakers, setTtsSpeakers] = useState<TtsSpeakerConfig[]>([
        { name: 'Sơn', voice: 'Kore', style: '' },
        { name: 'Jane', voice: 'Puck', style: '' },
    ]);
    const [ttsText, setTtsText] = useState('');
    const [ttsVoice, setTtsVoice] = useState<TtsVoice>('Kore');
    const [ttsReadingStyle, setTtsReadingStyle] = useState('');
    const [ttsChunks, setTtsChunks] = useState<string[]>([]);
    const [ttsDialogueOutput, setTtsDialogueOutput] = useState<TtsChunkOutput | null>(null);

    // VoiceCloningTab
    const [sourceVoiceFile, setSourceVoiceFile] = useState<File | null>(null);
    const [clonedVoiceText, setClonedVoiceText] = useState('');

    const [numberOfImages, setNumberOfImages] = useState(1);
    const [numberOfVideos, setNumberOfVideos] = useState(1);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');


    const resetInputs = () => {
        setIdea('');
        setIdeaInputMode('idea');
        setDirectPrompt('');
        setIdeaAnalysisMode('focused');
        setSelectedBranch('modern_human');
        setTechOptions({});
        setImageFile(null);
        setAnalysisMode('freestyle');
        setSubjectImageFile(null);
        setCustomPrompt('');
        setRestoreImageFile(null);
        setRestoreMode('single');
        setRestoreGender('');
        setRestoreAge('');
        setRestoreDescription('');
        setUpscaleImageFile(null);
        setCharacterImages([]);
        setSelectedCharacterIndices([]);
        setBackgroundImageFile(null);
        setCompositingDescription('');
        setVeoPrompt('');
        setVeoInputImage(null);
        setVeoModel('veo-3.1-fast-generate-preview');
        setVideoResolution('720p');
        setVideoAspectRatio('16:9');
        setNumberOfImages(1);
        setNumberOfVideos(1);
        setAspectRatio('auto');
        setYoutubeChannelUrl('');
        setYoutubeAnalysisType('swot');
        setYoutubeSubTab('analysis');
        setVideoStoryboardInputMode('topic');
        setVideoStoryboardTopic('');
        setVideoStoryboardDuration(15);
        setStoryboardVideoFile(null);
        setStoryboardScript('');
        setStoryboardLanguage('vi');
        setStoryboardVoice('Kore');
        setYoutubeScriptTopic('');
        setTtsMode('single');
        setTtsSpeakers([
            { name: 'Sơn', voice: 'Kore', style: '' },
            { name: 'Jane', voice: 'Puck', style: '' },
        ]);
        setTtsText('');
        setTtsVoice('Kore');
        setTtsReadingStyle('');
        setTtsChunks([]);
        setSourceVoiceFile(null);
        setClonedVoiceText('');
        setOriginalStory('');
        setCreativityLevel('balanced');
        setStoryTwists('');
        setStoryCharacterCount('');
        // Clear previous outputs and errors
        setError(null);
        setPrompts(null);
        setVideoPromptOutput(null);
        generatedVideoUrls.forEach(url => URL.revokeObjectURL(url));
        setGeneratedVideoUrls([]);
        setYoutubeAnalysisResult(null);
        setVideoStoryboardResult(null);
        setYoutubeScriptResult(null);
        storyboardAudio?.forEach(audio => URL.revokeObjectURL(audio.url));
        setStoryboardAudio(null);
        if (ttsChunkOutputs) {
            ttsChunkOutputs.forEach(output => {
                if (output.url) URL.revokeObjectURL(output.url);
            });
        }
        setTtsChunkOutputs(null);
        if (ttsDialogueOutput?.url) URL.revokeObjectURL(ttsDialogueOutput.url);
        setTtsDialogueOutput(null);
        if (clonedVoiceOutputUrl) URL.revokeObjectURL(clonedVoiceOutputUrl);
        setClonedVoiceOutputUrl(null);
        setClonedStoryOutput(null);
    };

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
    };
    
    const handleSetImageForAIGen = async (imageBase64: string) => {
        try {
            const response = await fetch(imageBase64);
            const blob = await response.blob();
            const file = new File([blob], `generated_image.${blob.type.split('/')[1] || 'png'}`, { type: blob.type });

            setSubjectImageFile(file);
            setActiveTab('ai_gen');
        } catch (e) {
            setError('Không thể tải ảnh để chỉnh sửa.');
            console.error(e);
        }
    };
    

    // --- Image History Helpers ---
    const getBase64ImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = reject;
            img.src = `data:image/png;base64,${base64}`;
        });
    };

    const addImagesToHistory = async (base64Images: string[]) => {
        const newImageOutputs = await Promise.all(
            base64Images.map(async (base64) => {
                const { width, height } = await getBase64ImageDimensions(base64);
                return {
                    src: base64,
                    resolution: `${width} x ${height}`,
                };
            })
        );
        setImageHistory(prev => [...newImageOutputs, ...prev].slice(0, 8));
    };
    
    const handleGenerate = async () => {
        setIsOutputVisible(true); // Show output section when generation starts
        setError(null);
        setPrompts(null);
        setVideoPromptOutput(null);
        setYoutubeAnalysisResult(null);
        setVideoStoryboardResult(null);
        setYoutubeScriptResult(null);
        setClonedStoryOutput(null);
        generatedVideoUrls.forEach(url => URL.revokeObjectURL(url));
        setGeneratedVideoUrls([]);
        storyboardAudio?.forEach(audio => URL.revokeObjectURL(audio.url));
        setStoryboardAudio(null);
        if (ttsChunkOutputs) {
            ttsChunkOutputs.forEach(output => {
                if (output.url) URL.revokeObjectURL(output.url);
            });
        }
        setTtsChunkOutputs(null);
        if (ttsDialogueOutput?.url) URL.revokeObjectURL(ttsDialogueOutput.url);
        setTtsDialogueOutput(null);
        if (clonedVoiceOutputUrl) URL.revokeObjectURL(clonedVoiceOutputUrl);
        setClonedVoiceOutputUrl(null);
        setIsLoading(true);
        setLoadingMessage('AI đang tạo kiệt tác...');

        const isPremiumAttempt = ['create_image', 'ai_gen', 'process_old_image', 'character_compositing', 'video', 'tts', 'voice_cloning', 'story_cloning', 'youtube_script'].includes(activeTab);

        try {
            let finalAspectRatio: Exclude<AspectRatio, 'auto'> = '1:1'; // Default fallback

            if (aspectRatio === 'auto') {
                let sourceFile: File | null = null;
                
                if (activeTab === 'ai_gen') {
                    sourceFile = subjectImageFile;
                } else if (activeTab === 'create_image' && createImageSubTab === 'image') {
                    sourceFile = imageFile;
                } else if (activeTab === 'character_compositing') {
                    sourceFile = backgroundImageFile; // Prioritize background image for aspect ratio
                }
                
                if (sourceFile) {
                    try {
                        setLoadingMessage('Đang xác định tỷ lệ ảnh...');
                        finalAspectRatio = await getImageAspectRatio(sourceFile);
                    } catch (e) {
                        console.error("Could not determine aspect ratio from image, defaulting to 1:1", e);
                    }
                }
            } else {
                finalAspectRatio = aspectRatio;
            }

            let finalPrompts: Prompts | null = null;

            if (activeTab === 'create_image') {
                if (createImageSubTab === 'idea') {
                     if (ideaInputMode === 'idea') {
                        if (!idea) throw new Error('Vui lòng nhập ý tưởng của bạn.');
                        setLoadingMessage('Đang rèn giũa prompt...');
                        finalPrompts = await geminiService.generatePromptsFromIdea(idea, selectedBranch, techOptions, ideaAnalysisMode);
                    } else { // 'direct' mode
                        if (!directPrompt) throw new Error('Vui lòng nhập prompt của bạn.');
                        finalPrompts = {
                            english: directPrompt,
                            vietnamese: 'Prompt được cung cấp trực tiếp bởi người dùng.'
                        };
                    }
                } else if (createImageSubTab === 'image') {
                    if (!imageFile) throw new Error('Vui lòng tải lên một hình ảnh.');
                    setLoadingMessage('Đang phân tích ảnh...');
                    finalPrompts = await geminiService.analyzeImage(imageFile, analysisMode, techOptions);
                }
            }
            
            if (finalPrompts) {
                setPrompts(finalPrompts);
                setLoadingMessage('Đang tạo hình ảnh...');
                const images = await geminiService.generateImageFromPrompts(finalPrompts, numberOfImages, finalAspectRatio);
                await addImagesToHistory(images);
            } else if (activeTab === 'ai_gen') {
                if (!subjectImageFile) throw new Error('Vui lòng cung cấp ảnh chính để chỉnh sửa.');
                if (!customPrompt) throw new Error('Vui lòng nhập yêu cầu của bạn.');
                
                if (numberOfImages > 1) {
                    setLoadingMessage(`Đang tạo ${numberOfImages} biến thể...`);
                    const imagePromises = Array.from({ length: numberOfImages }, (_, i) => 
                        geminiService.editImage(subjectImageFile, customPrompt, finalAspectRatio, i)
                    );
                    const images = await Promise.all(imagePromises);
                    await addImagesToHistory(images);
                } else {
                    setLoadingMessage('Đang chỉnh sửa ảnh...');
                    const editedImage = await geminiService.editImage(subjectImageFile, customPrompt, finalAspectRatio);
                    await addImagesToHistory([editedImage]);
                }
            } else if (activeTab === 'process_old_image') {
                if (processImageSubTab === 'restore') {
                    if (!restoreImageFile) throw new Error('Vui lòng cung cấp ảnh để khôi phục.');
                    setLoadingMessage('Đang phục chế ảnh...');
                    
                    const restoreOptions = {
                        mode: restoreMode,
                        gender: restoreGender || undefined,
                        age: restoreAge || undefined,
                        description: restoreDescription || undefined,
                    };

                    const restoredImage = await geminiService.restorePhoto(restoreImageFile, restoreOptions);
                    await addImagesToHistory([restoredImage]);
                } else if (processImageSubTab === 'upscale') {
                    if (!upscaleImageFile) throw new Error('Vui lòng cung cấp ảnh để tăng độ phân giải.');
                    setLoadingMessage('Đang tăng độ phân giải ảnh...');
                    const upscaledImage = await geminiService.upscaleImage(upscaleImageFile);
                    await addImagesToHistory([upscaledImage]);
                }
            } else if (activeTab === 'character_compositing') {
                if (selectedCharacterIndices.length === 0) throw new Error('Vui lòng chọn ít nhất một ảnh nhân vật để ghép.');
                if (!compositingDescription) throw new Error('Vui lòng nhập mô tả cho bối cảnh và hành động.');
                
                const selectedCharacterData = selectedCharacterIndices.map(index => ({
                    file: characterImages[index],
                    originalIndex: index + 1,
                }));
                
                if (numberOfImages > 1) {
                    setLoadingMessage(`Đang tạo ${numberOfImages} biến thể ghép...`);
                    const imagePromises = Array.from({ length: numberOfImages }, () => 
                        geminiService.compositeCharacters(selectedCharacterData, backgroundImageFile, compositingDescription, finalAspectRatio)
                    );
                    const images = await Promise.all(imagePromises);
                    await addImagesToHistory(images);
                } else {
                    setLoadingMessage('Đang ghép ảnh...');
                    const compositedImage = await geminiService.compositeCharacters(selectedCharacterData, backgroundImageFile, compositingDescription, finalAspectRatio);
                    await addImagesToHistory([compositedImage]);
                }
            } else if (activeTab === 'video') {
                if (!veoPrompt) throw new Error('Vui lòng nhập prompt cho video VEO 3.');
                
                setVideoPromptOutput(veoPrompt);
                
                const finalVideoUrls = await geminiService.generateVideo(
                    veoPrompt,
                    veoInputImage,
                    numberOfVideos,
                    veoModel,
                    videoResolution,
                    videoAspectRatio,
                    (message) => setLoadingMessage(message)
                );
                
                setGeneratedVideoUrls(finalVideoUrls);
            } else if (activeTab === 'video_storyboard') {
                 if (videoStoryboardInputMode === 'topic') {
                    if (!videoStoryboardTopic) throw new Error('Vui lòng nhập chủ đề cho kịch bản video.');
                    setLoadingMessage('Đang viết kịch bản từ chủ đề...');
                    const result = await geminiService.generateVideoStoryboard(videoStoryboardTopic, videoStoryboardDuration, storyboardLanguage);
                    setVideoStoryboardResult(result);
                } else if (videoStoryboardInputMode === 'video') { // 'video' mode
                    if (!storyboardVideoFile) throw new Error('Vui lòng tải lên video để tạo kịch bản tiếp theo.');
                    setLoadingMessage('Đang phân tích video và viết kịch bản tiếp theo...');
                    const result = await geminiService.generateStoryboardFromVideo(
                        storyboardVideoFile,
                        videoStoryboardDuration,
                        storyboardLanguage,
                        (message) => setLoadingMessage(message)
                    );
                    setVideoStoryboardResult(result);
                } else { // 'script' mode
                    if (!storyboardScript) throw new Error('Vui lòng nhập kịch bản của bạn.');
                    setLoadingMessage('Đang phân tích kịch bản và video tham chiếu (nếu có)...');
                    const result = await geminiService.generateStoryboardFromScript(
                        storyboardScript,
                        videoStoryboardDuration,
                        storyboardLanguage,
                        (message) => setLoadingMessage(message),
                        storyboardVideoFile // Pass the reference video
                    );
                    setVideoStoryboardResult(result);
                }
            } else if (activeTab === 'youtube_script') {
                if (!youtubeScriptTopic) throw new Error('Vui lòng nhập chủ đề cho kịch bản YouTube.');
                setLoadingMessage('Đang sáng tác câu chuyện tâm lý...');
                const result = await geminiService.generateYouTubeScript(youtubeScriptTopic);
                setYoutubeScriptResult(result);
            } else if (activeTab === 'story_cloning') {
                if (!originalStory) throw new Error('Vui lòng nhập câu chuyện gốc để clone.');
                setLoadingMessage('Đang phân tích và sáng tạo câu chuyện mới...');
                const newStory = await geminiService.cloneStory(
                    originalStory,
                    creativityLevel,
                    storyTwists,
                    storyCharacterCount
                );
                setClonedStoryOutput(newStory);
            } else if (activeTab === 'youtube_tools' && youtubeSubTab === 'analysis') {
                if (!youtubeChannelUrl) throw new Error('Vui lòng nhập link kênh YouTube.');
                setLoadingMessage('Đang phân tích kênh YouTube...');
                const result = await geminiService.analyzeYouTubeChannel(youtubeChannelUrl, youtubeAnalysisType, (message) => setLoadingMessage(message));
                setYoutubeAnalysisResult(result);
            } else if (activeTab === 'tts') {
                if (ttsMode === 'single') {
                    if (ttsChunks.length === 0) throw new Error('Vui lòng xử lý và chia nhỏ văn bản trước khi tạo âm thanh.');
                    setLoadingMessage(`Chuẩn bị tạo ${ttsChunks.length} đoạn âm thanh...`);
                    setTtsChunkOutputs([]); // Clear previous results and prepare for new ones

                    const generationPromises = ttsChunks.map((chunk, i) => 
                        (async () => {
                            try {
                                const audioBase64 = await geminiService.generateSpeech(chunk, ttsVoice, ttsReadingStyle);
                                const pcmBytes = decodeBase64ToUint8Array(audioBase64);
                                const blob = createWavBlobFromPcm(pcmBytes);
                                const url = URL.createObjectURL(blob);
                                const newOutput: TtsChunkOutput = {
                                    chunkIndex: i,
                                    url,
                                    base64: audioBase64,
                                    text: chunk,
                                };
                                setTtsChunkOutputs(prev => 
                                    [...(prev || []), newOutput].sort((a, b) => a.chunkIndex - b.chunkIndex)
                                );
                            } catch (chunkError: any) {
                                console.error(`Lỗi khi tạo âm thanh cho đoạn ${i + 1}:`, chunkError);
                                const errorOutput: TtsChunkOutput = {
                                    chunkIndex: i,
                                    text: chunk,
                                    error: chunkError.message || 'Lỗi không xác định',
                                };
                                setTtsChunkOutputs(prev => 
                                    [...(prev || []), errorOutput].sort((a, b) => a.chunkIndex - b.chunkIndex)
                                );
                            }
                        })()
                    );
                    setLoadingMessage(`Đang tạo ${ttsChunks.length} đoạn âm thanh song song...`);
                    await Promise.all(generationPromises);
                } else { // dialogue mode
                    if (!ttsText) throw new Error('Vui lòng nhập văn bản cho cuộc hội thoại.');
                    if (ttsSpeakers.length < 2) throw new Error('Chế độ hội thoại yêu cầu ít nhất 2 người nói.');
                    if (ttsSpeakers.some(s => !s.name.trim())) throw new Error('Vui lòng đặt tên cho tất cả người nói.');
                    
                    setLoadingMessage(`Đang phân tích kịch bản và tạo hội thoại...`);
                    
                    const audioParts = await geminiService.generateDialogueSpeech(
                        ttsText,
                        ttsSpeakers,
                        (progress) => setLoadingMessage(progress)
                    );
                    
                    if (audioParts.length === 0) {
                        throw new Error("Không có đoạn hội thoại nào được tạo. Vui lòng kiểm tra lại định dạng kịch bản.");
                    }

                    setLoadingMessage(`Đã tạo ${audioParts.length} đoạn thoại. Đang gộp thành 1 file...`);

                    const pcmDataArrays = audioParts.map(part => decodeBase64ToUint8Array(part.audioBase64));
                    const totalLength = pcmDataArrays.reduce((acc, val) => acc + val.length, 0);
                    const combinedPcm = new Uint8Array(totalLength);
                    let offset = 0;
                    for (const pcmArray of pcmDataArrays) {
                        combinedPcm.set(pcmArray, offset);
                        offset += pcmArray.length;
                    }

                    const mergedBlob = createWavBlobFromPcm(combinedPcm);
                    const url = URL.createObjectURL(mergedBlob);
                    
                    setTtsDialogueOutput({
                        chunkIndex: 0,
                        url,
                        text: ttsText,
                    });
                }
            } else if (activeTab === 'voice_cloning') {
                if (!sourceVoiceFile) throw new Error('Vui lòng tải lên file âm thanh giọng nói mẫu.');
                if (!clonedVoiceText) throw new Error('Vui lòng nhập văn bản để tạo giọng nói.');
                setLoadingMessage('Đang phân tích giọng nói mẫu...');
                const audioBase64 = await geminiService.cloneVoice(
                    sourceVoiceFile,
                    clonedVoiceText,
                    (message) => setLoadingMessage(message)
                );
                const pcmBytes = decodeBase64ToUint8Array(audioBase64);
                const blob = createWavBlobFromPcm(pcmBytes);
                const url = URL.createObjectURL(blob);
                setClonedVoiceOutputUrl(url);
            }

            setLoadingMessage('Hoàn thành!');
            // If the premium attempt was successful and we didn't know its status, update it.
            if (isPremiumAttempt && apiKeyStatus.premium === 'unknown') {
                onUpdatePremiumStatus('yes');
            }

        } catch (err: any) {
            console.error(err);
            let errorMessage = err.message || 'Vui lòng thử lại.';
            
            // Case 1: Premium feature fails with a 404. This is a permission/billing issue.
            const isPermissionError = 
                isPremiumAttempt && 
                (
                    err.message?.includes('Requested entity was not found.') ||
                    err.message?.includes('NOT_FOUND') ||
                    err.message?.includes('404')
                );

            if (isPermissionError) {
                onUpdatePremiumStatus('no');
                setError('Lỗi Quyền Truy Cập (404 NOT FOUND): Mã API của bạn không có quyền truy cập tính năng này. Điều này thường xảy ra khi dự án Google Cloud chưa được liên kết với tài khoản thanh toán. Vui lòng kiểm tra lại cấu hình. Tìm hiểu thêm tại: cloud.google.com/billing/docs/how-to/create-billing-account');
                return; // Exit after setting the error and status.
            }
            
            // Case 2: Any other definitive API key-related error. This is a truly invalid key.
            const isDefiniteApiKeyError = 
                err.message?.includes('API key not valid') ||
                err.message?.includes('API_KEY_INVALID') ||
                err.message?.includes('PERMISSION_DENIED') ||
                err.message?.includes('403') ||
                err.message?.includes('400') || 
                err.message?.includes('Mã API Google Gemini chưa được cấu hình');

            if (isDefiniteApiKeyError) {
                setError('Mã API của bạn không hợp lệ hoặc đã hết hạn. Vui lòng nhập lại mã mới.');
                onInvalidApiKey(); // This will log the user out by clearing the key.
                return;
            }

            // Case 3: All other errors (network, parsing, etc.)
            try {
                // The error message from the SDK might be a JSON string.
                const errorObj = JSON.parse(errorMessage);
                if (errorObj.error && errorObj.error.message) {
                    if (errorObj.error.status === 'RESOURCE_EXHAUSTED') {
                        errorMessage = 'Bạn đã đạt đến giới hạn sử dụng API (Lỗi RESOURCE_EXHAUSTED). Vui lòng đợi và thử lại sau. Để theo dõi mức sử dụng của bạn, truy cập: ai.dev/usage. Để biết thêm chi tiết về giới hạn, truy cập: ai.google.dev/gemini-api/docs/rate-limits';
                    } else {
                        errorMessage = errorObj.error.message;
                    }
                }
            } catch (e) {
                // Not a JSON string, use the raw message
            }
            setError(`Đã xảy ra lỗi: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageDelete = (indexToDelete: number) => {
        setImageHistory(prevHistory => prevHistory.filter((_, index) => index !== indexToDelete));
    };

    const handleVideoDelete = (indexToDelete: number) => {
        setGeneratedVideoUrls(prevUrls => {
            const urlToDelete = prevUrls[indexToDelete];
            if (urlToDelete) {
                URL.revokeObjectURL(urlToDelete);
            }
            return prevUrls.filter((_, index) => index !== indexToDelete);
        });
    };
    
    const handleGenerateVideoFromStoryboard = async () => {
        if (!videoStoryboardResult || !videoStoryboardResult.scenes || videoStoryboardResult.scenes.length === 0) {
            setError("Không có kịch bản để tạo video.");
            return;
        }

        setIsOutputVisible(true);
        setError(null);
        setPrompts(null);
        setVideoPromptOutput(null);
        generatedVideoUrls.forEach(url => URL.revokeObjectURL(url));
        setGeneratedVideoUrls([]);
        storyboardAudio?.forEach(audio => URL.revokeObjectURL(audio.url));
        setStoryboardAudio(null);
        setIsLoading(true);
        
        const scenes = videoStoryboardResult.scenes;
        const totalScenes = scenes.length;

        try {
            for (let i = 0; i < scenes.length; i++) {
                const scene = scenes[i];
                const sceneProgressMessage = `Đang tạo Cảnh ${i + 1}/${totalScenes}: ${scene.description}`;
                setLoadingMessage(sceneProgressMessage);

                // generateVideo returns an array of URLs. We expect one.
                const newVideoUrls = await geminiService.generateVideo(
                    scene.prompt,
                    null, // no input image
                    1,    // only one video per scene
                    'veo-3.1-fast-generate-preview', // Default model for storyboard generation
                    '720p',
                    '16:9',
                    (progress) => {
                        // This gives more detailed progress for the current scene
                        setLoadingMessage(`${sceneProgressMessage}\n(${progress})`);
                    }
                );
                
                // Add the new video to the list immediately so user sees progress
                setGeneratedVideoUrls(prev => [...prev, ...newVideoUrls]);
            }
            setLoadingMessage('Hoàn thành tạo tất cả các cảnh video!');
        } catch (err: any) {
            console.error(err);
            setError(`Đã xảy ra lỗi khi tạo video từ kịch bản: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateTTSFromStoryboard = async () => {
        if (!videoStoryboardResult) {
            setError("Không có kịch bản để tạo âm thanh.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Đang tạo âm thanh từ kịch bản...');
        setError(null);
        storyboardAudio?.forEach(audio => URL.revokeObjectURL(audio.url));
        setStoryboardAudio(null);

        try {
            const audioResults = await geminiService.generateSpeechFromStoryboard(videoStoryboardResult, storyboardVoice);
            
            const audioWithUrls = audioResults.map(result => {
                const pcmBytes = decodeBase64ToUint8Array(result.audioBase64);
                const blob = createWavBlobFromPcm(pcmBytes);
                const url = URL.createObjectURL(blob);
                return { ...result, url };
            });

            setStoryboardAudio(audioWithUrls);
            setLoadingMessage('Tạo âm thanh thành công!');
        } catch (err: any) {
            console.error(err);
            setError(`Lỗi khi tạo TTS: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMergeAndDownloadWav = async () => {
        if (!ttsChunkOutputs || ttsChunkOutputs.length === 0) return;

        setIsLoading(true);
        setLoadingMessage("Đang gộp các file âm thanh...");
        setError(null);

        try {
            // 1. Fetch all blobs in the correct order, filtering for successful ones
            const successfulOutputs = ttsChunkOutputs
                .filter(output => !!output.url) // Filter out chunks with errors
                .sort((a, b) => a.chunkIndex - b.chunkIndex);

            if (successfulOutputs.length === 0) {
                throw new Error("Không có đoạn âm thanh thành công nào để gộp.");
            }
            
            setLoadingMessage(`Đang gộp ${successfulOutputs.length} file âm thanh thành công...`);

            const blobPromises = successfulOutputs
                .map(output => fetch(output.url!).then(res => res.blob()));
            const wavBlobs = await Promise.all(blobPromises);

            // 2. Extract PCM data from each blob
            const pcmDataArrays: Uint8Array[] = [];
            for (const blob of wavBlobs) {
                const buffer = await blob.arrayBuffer();
                // A standard WAV header is 44 bytes. We slice the buffer to get the raw PCM data.
                // This assumes the WAV files created by `createWavBlobFromPcm` have a consistent 44-byte header.
                if (buffer.byteLength > 44) {
                     pcmDataArrays.push(new Uint8Array(buffer.slice(44)));
                }
            }

            // 3. Concatenate all PCM data arrays into one
            const totalLength = pcmDataArrays.reduce((acc, val) => acc + val.length, 0);
            const combinedPcm = new Uint8Array(totalLength);
            let offset = 0;
            for (const pcmArray of pcmDataArrays) {
                combinedPcm.set(pcmArray, offset);
                offset += pcmArray.length;
            }

            // 4. Create a new WAV blob with the combined PCM data
            const mergedBlob = createWavBlobFromPcm(combinedPcm);

            // 5. Trigger the download
            const url = URL.createObjectURL(mergedBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pidtap-studio-tts-merged-${Date.now()}.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (err: any) {
            setError(`Lỗi khi gộp file âm thanh: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMergeAndDownloadStoryboardAudio = async () => {
        if (!storyboardAudio || storyboardAudio.length === 0) return;

        setIsLoading(true);
        setLoadingMessage("Đang gộp các file âm thanh từ kịch bản...");
        setError(null);

        try {
            const successfulAudio = storyboardAudio
                .filter(audio => !!audio.url)
                .sort((a, b) => a.scene - b.scene); // Ensure correct order by scene number

            if (successfulAudio.length === 0) {
                throw new Error("Không có đoạn âm thanh thành công nào để gộp.");
            }
            
            setLoadingMessage(`Đang gộp ${successfulAudio.length} file âm thanh...`);

            // Fetch all blobs
            const blobPromises = successfulAudio
                .map(audio => fetch(audio.url!).then(res => res.blob()));
            const wavBlobs = await Promise.all(blobPromises);

            // Extract PCM data from each blob (skipping 44-byte WAV header)
            const pcmDataArrays: Uint8Array[] = [];
            for (const blob of wavBlobs) {
                const buffer = await blob.arrayBuffer();
                if (buffer.byteLength > 44) {
                     pcmDataArrays.push(new Uint8Array(buffer.slice(44)));
                }
            }

            // Concatenate all PCM data
            const totalLength = pcmDataArrays.reduce((acc, val) => acc + val.length, 0);
            const combinedPcm = new Uint8Array(totalLength);
            let offset = 0;
            for (const pcmArray of pcmDataArrays) {
                combinedPcm.set(pcmArray, offset);
                offset += pcmArray.length;
            }

            // Create a new WAV blob with the combined data
            const mergedBlob = createWavBlobFromPcm(combinedPcm);

            // Trigger download
            const url = URL.createObjectURL(mergedBlob);
            const link = document.createElement('a');
            link.href = url;
            const fileName = videoStoryboardResult?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'storyboard';
            link.download = `${fileName}-audio-merged.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (err: any) {
            setError(`Lỗi khi gộp file âm thanh: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Video Editor Handlers ---
    const handleOpenVideoEditor = (url: string, index: number) => {
        setVideoToEdit({ url, index });
    };

    const handleCloseVideoEditor = () => {
        setVideoToEdit(null);
    };

    const handleSaveEditedVideo = (newVideoUrl: string) => {
        if (videoToEdit === null) return;

        const { index: editedIndex, url: oldUrl } = videoToEdit;

        // Revoke the old object URL to free up memory
        URL.revokeObjectURL(oldUrl);

        // Update the array with the new URL
        setGeneratedVideoUrls(prevUrls => 
            prevUrls.map((url, index) => (index === editedIndex ? newVideoUrl : url))
        );

        // Close the editor
        setVideoToEdit(null);
    };
    
    const getActionText = () => {
        if (isLoading) return 'Đang xử lý...';
        switch (activeTab) {
            case 'process_old_image':
                return processImageSubTab === 'restore' ? 'Khôi phục' : 'Upscale';
            case 'video': return 'Tạo Video';
            case 'character_compositing': return 'Ghép ảnh';
            case 'youtube_tools':
                 return youtubeSubTab === 'analysis' ? 'Phân tích' : 'Tải Video';
            case 'video_storyboard': return 'Tạo Kịch bản';
            case 'youtube_script': return 'Tạo Kịch bản';
            case 'voice_cloning': return 'Sao chép Giọng nói';
            case 'story_cloning': return 'Viết lại Truyện';
            case 'ai_gen':
            case 'create_image':
            default: return 'Gen Img';
        }
    };
    
    const getActionIcon = () => {
        if (isLoading) return 'fa-spinner fa-spin';
        switch (activeTab) {
            case 'process_old_image':
                return processImageSubTab === 'restore' ? 'fa-photo-film' : 'fa-magnifying-glass-plus';
            case 'video': return 'fa-video';
            case 'character_compositing': return 'fa-users-viewfinder';
            case 'youtube_tools':
                return youtubeSubTab === 'analysis' ? 'fa-magnifying-glass-chart' : 'fa-download';
            case 'video_storyboard': return 'fa-clapperboard';
            case 'youtube_script': return 'fa-feather-pen';
            case 'voice_cloning': return 'fa-user-astronaut';
            case 'story_cloning': return 'fa-book-sparkles';
            case 'ai_gen':
            case 'create_image':
            default: return 'fa-robot';
        }
    };

    const isPremiumFeature = ['create_image', 'ai_gen', 'process_old_image', 'character_compositing', 'video', 'tts', 'voice_cloning', 'story_cloning', 'youtube_script'].includes(activeTab);
    const isPremiumDisabled = apiKeyStatus.premium === 'no' && isPremiumFeature;
    const isGenerateButtonDisabled = isLoading || (activeTab === 'youtube_tools' && youtubeSubTab === 'downloader') || isPremiumDisabled;
    const hasOutput = imageHistory.length > 0 || videoPromptOutput || generatedVideoUrls.length > 0 || !!youtubeAnalysisResult || !!videoStoryboardResult || !!youtubeScriptResult || (ttsChunkOutputs && ttsChunkOutputs.length > 0) || !!ttsDialogueOutput || !!clonedVoiceOutputUrl || !!clonedStoryOutput;


    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Header authType={authType} onLogout={onLogout} />
            <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8">
                <div className="bg-slate-800/60 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl shadow-black/30 border border-slate-700">
                    <Tabs activeTab={activeTab} onTabChange={handleTabChange} />
                    
                    {isPremiumDisabled && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-lg text-center mb-6 animate-fade-in">
                            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                            <strong>Tính năng nâng cao bị khóa:</strong> Mã API của bạn không có quyền truy cập. Vui lòng <button onClick={onInvalidApiKey} className="underline font-bold hover:text-yellow-100">sử dụng một mã khác</button> có liên kết với dự án Google Cloud đã bật thanh toán.
                        </div>
                    )}
                    
                    <div key={activeTab} className="mt-6 animate-fade-in">
                        <>
                            {activeTab === 'ai_gen' && <AIGenTab subjectImageFile={subjectImageFile} setSubjectImageFile={setSubjectImageFile} customPrompt={customPrompt} setCustomPrompt={setCustomPrompt} />}

                            {activeTab === 'create_image' && (
                                <div>
                                    <div className="flex space-x-6 border-b border-slate-700 mb-6">
                                        <button
                                            className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-colors focus:outline-none ${createImageSubTab === 'idea' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                                            onClick={() => setCreateImageSubTab('idea')}
                                            aria-pressed={createImageSubTab === 'idea'}
                                        >
                                            <i className="fa-solid fa-lightbulb"></i>
                                            <span>Từ Ý Tưởng</span>
                                        </button>
                                        <button
                                            className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-colors focus:outline-none ${createImageSubTab === 'image' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                                            onClick={() => setCreateImageSubTab('image')}
                                            aria-pressed={createImageSubTab === 'image'}
                                        >
                                            <i className="fa-solid fa-camera-retro"></i>
                                            <span>Từ Hình Ảnh</span>
                                        </button>
                                    </div>
                                    <div>
                                        {createImageSubTab === 'idea' && <IdeaTab
                                            idea={idea} setIdea={setIdea}
                                            selectedBranch={selectedBranch} setSelectedBranch={setSelectedBranch}
                                            techOptions={techOptions} setTechOptions={setTechOptions}
                                            inputMode={ideaInputMode} setInputMode={setIdeaInputMode}
                                            analysisMode={ideaAnalysisMode} setAnalysisMode={setIdeaAnalysisMode}
                                            directPrompt={directPrompt} setDirectPrompt={setDirectPrompt}
                                        />}
                                        {/* FIX: Corrected a typo on the `ImageTab` component. The prop for setting the analysis mode was incorrectly named `setAnalysisType` and has been changed to `setAnalysisMode` to match the component's expected props. */}
                                        {createImageSubTab === 'image' && <ImageTab imageFile={imageFile} setImageFile={setImageFile} analysisMode={analysisMode} setAnalysisMode={setAnalysisMode} techOptions={techOptions} setTechOptions={setTechOptions} />}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'character_compositing' && <CharacterCompositingTab
                                characterImages={characterImages}
                                setCharacterImages={setCharacterImages}
                                selectedIndices={selectedCharacterIndices}
                                setSelectedIndices={setSelectedCharacterIndices}
                                backgroundImage={backgroundImageFile}
                                setBackgroundImage={setBackgroundImageFile}
                                description={compositingDescription}
                                setDescription={setCompositingDescription}
                            />}
                            
                            {activeTab === 'process_old_image' && (
                                <div>
                                    <div className="flex space-x-6 border-b border-slate-700 mb-6">
                                        <button
                                            className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-colors focus:outline-none ${processImageSubTab === 'restore' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                                            onClick={() => setProcessImageSubTab('restore')}
                                            aria-pressed={processImageSubTab === 'restore'}
                                        >
                                            <i className="fa-solid fa-photo-film"></i>
                                            <span>Khôi Phục Ảnh</span>
                                        </button>
                                        <button
                                            className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-colors focus:outline-none ${processImageSubTab === 'upscale' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                                            onClick={() => setProcessImageSubTab('upscale')}
                                            aria-pressed={processImageSubTab === 'upscale'}
                                        >
                                            <i className="fa-solid fa-magnifying-glass-plus"></i>
                                            <span>Upscale</span>
                                        </button>
                                    </div>
                                    <div>
                                        {processImageSubTab === 'restore' && <RestoreTab
                                            restoreImageFile={restoreImageFile} setRestoreImageFile={setRestoreImageFile}
                                            mode={restoreMode} setMode={setRestoreMode}
                                            gender={restoreGender} setGender={setRestoreGender}
                                            age={restoreAge} setAge={setRestoreAge}
                                            description={restoreDescription} setDescription={setRestoreDescription}
                                        />}
                                        {processImageSubTab === 'upscale' && <UpscaleTab upscaleImageFile={upscaleImageFile} setUpscaleImageFile={setUpscaleImageFile} />}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'video' && <VideoTab
                                prompt={veoPrompt}
                                setPrompt={setVeoPrompt}
                                inputImage={veoInputImage}
                                setInputImage={setVeoInputImage}
                                veoModel={veoModel}
                                setVeoModel={setVeoModel}
                                resolution={videoResolution}
                                setResolution={setVideoResolution}
                                videoAspectRatio={videoAspectRatio}
                                setVideoAspectRatio={setVideoAspectRatio}
                            />}

                            {activeTab === 'video_storyboard' && <VideoStoryboardTab
                                inputMode={videoStoryboardInputMode}
                                setInputMode={setVideoStoryboardInputMode}
                                topic={videoStoryboardTopic}
                                setTopic={setVideoStoryboardTopic}
                                duration={videoStoryboardDuration}
                                setDuration={setVideoStoryboardDuration}
                                videoFile={storyboardVideoFile}
                                setVideoFile={setStoryboardVideoFile}
                                script={storyboardScript}
                                setScript={setStoryboardScript}
                                storyboardLanguage={storyboardLanguage}
                                setStoryboardLanguage={setStoryboardLanguage}
                                storyboardVoice={storyboardVoice}
                                setStoryboardVoice={setStoryboardVoice}
                            />}
                            
                            {activeTab === 'youtube_script' && <YouTubeScriptTab
                                topic={youtubeScriptTopic}
                                setTopic={setYoutubeScriptTopic}
                            />}

                            {activeTab === 'story_cloning' && <StoryCloningTab 
                                originalStory={originalStory}
                                setOriginalStory={setOriginalStory}
                                creativityLevel={creativityLevel}
                                setCreativityLevel={setCreativityLevel}
                                storyTwists={storyTwists}
                                setStoryTwists={setStoryTwists}
                                storyCharacterCount={storyCharacterCount}
                                setStoryCharacterCount={setStoryCharacterCount}
                            />}

                            {activeTab === 'tts' && <TtsTab 
                                text={ttsText}
                                setText={setTtsText}
                                voice={ttsVoice}
                                setVoice={setTtsVoice}
                                readingStyle={ttsReadingStyle}
                                setReadingStyle={setTtsReadingStyle}
                                chunks={ttsChunks}
                                setChunks={setTtsChunks}
                                ttsChunkOutputs={ttsChunkOutputs}
                                isGenerating={isLoading}
                                onGenerate={handleGenerate}
                                onMergeAndDownload={handleMergeAndDownloadWav}
                                ttsMode={ttsMode}
                                setTtsMode={setTtsMode}
                                ttsSpeakers={ttsSpeakers}
                                setTtsSpeakers={setTtsSpeakers}
                                ttsDialogueOutput={ttsDialogueOutput}
                            />}

                            {activeTab === 'voice_cloning' && <VoiceCloningTab 
                                sourceVoiceFile={sourceVoiceFile}
                                setSourceVoiceFile={setSourceVoiceFile}
                                textToClone={clonedVoiceText}
                                setTextToClone={setClonedVoiceText}
                            />}

                            {activeTab === 'youtube_tools' && (
                                <div>
                                    <div className="flex space-x-6 border-b border-slate-700 mb-6">
                                        <button
                                            className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-colors focus:outline-none ${youtubeSubTab === 'analysis' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                                            onClick={() => setYoutubeSubTab('analysis')}
                                            aria-pressed={youtubeSubTab === 'analysis'}
                                        >
                                            <i className="fa-solid fa-magnifying-glass-chart"></i>
                                            <span>Phân tích Kênh</span>
                                        </button>
                                        <button
                                            className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-colors focus:outline-none ${youtubeSubTab === 'downloader' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                                            onClick={() => setYoutubeSubTab('downloader')}
                                            aria-pressed={youtubeSubTab === 'downloader'}
                                        >
                                            <i className="fa-solid fa-download"></i>
                                            <span>Tải Video</span>
                                        </button>
                                    </div>
                                    <div>
                                        {youtubeSubTab === 'analysis' && <YouTubeAnalysisTab 
                                            channelUrl={youtubeChannelUrl}
                                            setChannelUrl={setYoutubeChannelUrl}
                                            analysisType={youtubeAnalysisType}
                                            setAnalysisType={setYoutubeAnalysisType}
                                        />}
                                        {youtubeSubTab === 'downloader' && <YouTubeDownloaderTab />}
                                    </div>
                                </div>
                            )}
                        </>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-700 flex flex-wrap items-center justify-between gap-4">
                         <div className="flex flex-wrap items-center gap-4">
                            {['create_image', 'ai_gen', 'character_compositing'].includes(activeTab) && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="aspect-ratio-selector" className="font-medium text-slate-400 text-sm">Tỷ lệ:</label>
                                        <select 
                                            id="aspect-ratio-selector"
                                            value={aspectRatio}
                                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                                            disabled={isLoading}
                                            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="auto">Theo ảnh gốc</option>
                                            <option value="1:1">Vuông (1:1)</option>
                                            <option value="16:9">Ngang (16:9)</option>
                                            <option value="9:16">Dọc (9:16)</option>
                                            <option value="4:3">Ngang (4:3)</option>
                                            <option value="3:4">Dọc (3:4)</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="num-images" className="font-medium text-slate-400 text-sm">Số lượng:</label>
                                        <select 
                                            id="num-images"
                                            value={numberOfImages}
                                            onChange={(e) => setNumberOfImages(Number(e.target.value))}
                                            disabled={isLoading}
                                            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                        </select>
                                    </div>
                                </>
                            )}
                             {activeTab === 'video' && (
                                <div className="flex items-center gap-2">
                                    <label htmlFor="num-videos" className="font-medium text-slate-400 text-sm">Số lượng:</label>
                                    <select 
                                        id="num-videos"
                                        value={numberOfVideos}
                                        onChange={(e) => setNumberOfVideos(Number(e.target.value))}
                                        disabled={isLoading}
                                        className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                    </select>
                                </div>
                            )}
                            {activeTab !== 'tts' && (
                                <button 
                                    onClick={handleGenerate} 
                                    disabled={isGenerateButtonDisabled}
                                    className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2.5 text-lg transform hover:-translate-y-0.5 ${isLoading ? 'gen-button-loading cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:shadow-indigo-500/40'} ${isGenerateButtonDisabled ? 'bg-slate-600 hover:bg-slate-600 shadow-none cursor-not-allowed opacity-60' : ''}`}
                                >
                                    <i className={`fa-solid ${getActionIcon()}`}></i>
                                    {getActionText()}
                                </button>
                            )}
                             <button
                                onClick={() => setIsOutputVisible(v => !v)}
                                disabled={!hasOutput}
                                title={isOutputVisible ? 'Ẩn kết quả' : 'Xem kết quả'}
                                aria-label="Toggle results visibility"
                                className="relative px-4 py-3 bg-slate-700 text-white font-bold rounded-lg shadow-md hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2 text-lg"
                            >
                                <i className="fa-solid fa-images"></i>
                                {hasOutput && (
                                    <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-slate-800/60">
                                        {imageHistory.length + generatedVideoUrls.length + (youtubeAnalysisResult ? 1 : 0) + (videoStoryboardResult ? 1 : 0) + (youtubeScriptResult ? 1 : 0) + (ttsChunkOutputs ? ttsChunkOutputs.length : 0) + (ttsDialogueOutput ? 1 : 0) + (clonedVoiceOutputUrl ? 1 : 0) + (clonedStoryOutput ? 1 : 0)}
                                    </span>
                                )}
                            </button>
                        </div>
                        <button 
                            onClick={resetInputs}
                            disabled={isLoading}
                            className="px-5 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                           <i className="fa-solid fa-undo"></i> Làm lại
                        </button>
                    </div>
                </div>

                {isOutputVisible && (
                    <OutputSection
                        isLoading={isLoading}
                        loadingMessage={loadingMessage}
                        error={error}
                        generatedImages={imageHistory}
                        videoPromptOutput={videoPromptOutput}
                        generatedVideoUrls={generatedVideoUrls}
                        youtubeAnalysisResult={youtubeAnalysisResult}
                        videoStoryboardResult={videoStoryboardResult}
                        youtubeScriptResult={youtubeScriptResult}
                        storyboardAudio={storyboardAudio}
                        clonedVoiceOutputUrl={clonedVoiceOutputUrl}
                        clonedStoryOutput={clonedStoryOutput}
                        onSetImageForAIGen={handleSetImageForAIGen}
                        onImageDelete={handleImageDelete}
                        onVideoDelete={handleVideoDelete}
                        onOpenVideoEditor={handleOpenVideoEditor}
                        onGenerateVideoFromStoryboard={handleGenerateVideoFromStoryboard}
                        onGenerateTTSFromStoryboard={handleGenerateTTSFromStoryboard}
                        onMergeAndDownloadStoryboardAudio={handleMergeAndDownloadStoryboardAudio}
                    />
                )}
            </main>
            <Footer />
            {videoToEdit && (
                <VideoEditorModal
                    videoUrl={videoToEdit.url}
                    onClose={handleCloseVideoEditor}
                    onSave={handleSaveEditedVideo}
                />
            )}
        </div>
    );
};

export default App;
