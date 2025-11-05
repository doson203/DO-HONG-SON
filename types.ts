// FIX: Define and export all necessary types for the application.
// This resolves circular dependency and missing export errors across multiple files.
export type Tab = 'ai_gen' | 'create_image' | 'process_old_image' | 'character_compositing' | 'video' | 'youtube_tools' | 'video_storyboard' | 'tts' | 'voice_cloning' | 'story_cloning' | 'youtube_script';

export type CreateImageSubTab = 'idea' | 'image';
export type ProcessOldImageSubTab = 'restore' | 'upscale';

export type Branch = 'modern_human' | 'prehistoric_human' | 'modern_creature' | 'prehistoric_creature' | 'landscape_scene';

export type TechOptions = {
    style?: string;
    layout?: string;
    angle?: string;
    quality?: string;
};

export type Prompts = {
    english: string;
    vietnamese: string;
};

export type ImageAnalysisMode = 'freestyle' | 'focused';

export type ImageOutput = {
    src: string;
    resolution: string;
};

export type AspectRatio = 'auto' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

// New types for advanced VEO 3 video generation
export type VeoModel = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
export type VideoResolution = '720p' | '1080p';
export type VideoAspectRatio = '16:9' | '9:16';


export type YouTubeAnalysisType = 'swot' | 'content_strategy' | 'audience_engagement' | 'growth_opportunities';

// Types for the Video Storyboard feature
export type VideoStoryboardInputMode = 'topic' | 'video' | 'script';

export interface Scene {
    scene: number;
    description: string;
    narration: string; // Narration/dialogue for this specific scene
    prompt: string;
}

export interface VideoStoryboard {
    title: string;
    logline: string;
    scenes: Scene[];
}

// New type for storyboard audio
export type StoryboardAudio = {
    scene: number;
    audioBase64: string;
    url: string;
};


// Types for the new Video Editor feature
export type VideoEffect = 'none' | 'grayscale' | 'sepia' | 'invert' | 'brightness';

// Types for the new TTS Tab
export type TtsVoice =
    'Achernar' | 'Achird' | 'Algenib' | 'Algieba' | 'Alnilam' | 
    'Aoede' | 'Autonoe' | 'Callirrhoe' | 'Charon' | 'Despina' |
    'Enceladus' | 'Erinome' | 'Fenrir' | 'Gacrux' | 'Iapetus' |
    'Kore' | 'Laomedeia' | 'Leda' | 'Orus' | 'Puck' |
    'Pulcherrima' | 'Rasalgethi' | 'Sadachbia' | 'Sadaltager' | 'Schedar' |
    'Sulafat' | 'Umbriel' | 'Vindemiatrix' | 'Zephyr' | 'Zubenelgenubi';


export type TtsChunkOutput = {
  chunkIndex: number;
  url?: string;
  base64?: string;
  text: string;
  error?: string;
};

export type TtsMode = 'single' | 'dialogue';

export type TtsSpeakerConfig = {
  name: string;
  voice: TtsVoice;
  style: string;
};

// New type for Story Cloning
export type CreativityLevel = 'faithful' | 'balanced' | 'creative';

// New type for YouTube Script Generation
export interface YouTubeScriptResult {
  titles: string[];
  hook: string;
  descriptions: string[];
  thumbnail_captions: string[];
  story_parts: string[]; // Array of 7 strings for each part
}


// FIX: Add HistoryItem type to resolve import error in HistoryTab.tsx
export type HistoryPreview = {
    type: 'image' | 'video' | 'text' | 'storyboard';
    data: string; // base64 for image, url for video, text for others
};

export type HistoryItem = {
    id: number;
    timestamp: number;
    tab: Tab;
    preview: HistoryPreview;
    state: any; // Using `any` as the state shape is complex and varies per tab.
};