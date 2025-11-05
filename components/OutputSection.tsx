import React, { useState, useRef } from 'react';
import { ImageOutput, VideoStoryboard, StoryboardAudio, YouTubeScriptResult } from '../types';
import Spinner from './Spinner';

interface OutputSectionProps {
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    generatedImages: ImageOutput[];
    videoPromptOutput: string | null;
    generatedVideoUrls: string[];
    youtubeAnalysisResult: string | null;
    videoStoryboardResult: VideoStoryboard | null;
    youtubeScriptResult: YouTubeScriptResult | null; // New
    storyboardAudio: StoryboardAudio[] | null;
    clonedVoiceOutputUrl: string | null;
    clonedStoryOutput: string | null; // New prop for story cloning result
    onSetImageForAIGen: (image: string) => void;
    onImageDelete: (index: number) => void;
    onVideoDelete: (index: number) => void;
    onOpenVideoEditor: (url: string, index: number) => void;
    onGenerateVideoFromStoryboard: () => void;
    onGenerateTTSFromStoryboard: () => void;
    onMergeAndDownloadStoryboardAudio: () => void;
}

const CopyButton: React.FC<{ textToCopy: string, className?: string }> = ({ textToCopy, className }) => {
    const [isCopied, setIsCopied] = useState(false);
    const handleCopy = () => {
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
    };
    return (
        <button
            onClick={handleCopy}
            className={`px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition-colors flex items-center gap-1.5 ${className}`}
        >
            <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-copy'}`}></i>
            <span>{isCopied ? 'Đã sao chép!' : 'Sao chép'}</span>
        </button>
    );
};


const OutputSection: React.FC<OutputSectionProps> = ({ 
    isLoading, loadingMessage, error, 
    generatedImages, videoPromptOutput, generatedVideoUrls, 
    youtubeAnalysisResult, videoStoryboardResult, youtubeScriptResult, storyboardAudio,
    clonedVoiceOutputUrl, clonedStoryOutput,
    onSetImageForAIGen, onImageDelete, onVideoDelete, onOpenVideoEditor,
    onGenerateVideoFromStoryboard, onGenerateTTSFromStoryboard,
    onMergeAndDownloadStoryboardAudio,
}) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isYTCopied, setIsYTCopied] = useState(false);
    const [isStoryCopied, setIsStoryCopied] = useState(false); // New state for story copy
    const [copiedScenePrompts, setCopiedScenePrompts] = useState<{ [key: number]: boolean }>({});
    const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
    const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());


    const hasImageContent = generatedImages.length > 0;
    const hasVideoPromptContent = !!videoPromptOutput;
    const hasVideoContent = generatedVideoUrls.length > 0;
    const hasYTContent = !!youtubeAnalysisResult;
    const hasStoryboardContent = !!videoStoryboardResult;
    const hasClonedVoiceContent = !!clonedVoiceOutputUrl;
    const hasClonedStoryContent = !!clonedStoryOutput;
    const hasYouTubeScriptContent = !!youtubeScriptResult;
    const hasContent = hasImageContent || hasVideoPromptContent || hasVideoContent || hasYTContent || hasStoryboardContent || hasClonedVoiceContent || hasClonedStoryContent || hasYouTubeScriptContent;
    const hasError = !!error;

    const handleDownloadAll = () => {
        generatedImages.forEach((image, index) => {
            try {
                const link = document.createElement('a');
                link.href = `data:image/png;base64,${image.src}`;
                link.download = `pidtap-studio-${Date.now()}-${index + 1}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e) {
                console.error("Failed to trigger download for image", index, e);
            }
        });
    };
    
    const handleCopyPrompt = () => {
        if (videoPromptOutput) {
            navigator.clipboard.writeText(videoPromptOutput).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
    };
    
    const handleCopyYTAnalysis = () => {
        if (youtubeAnalysisResult) {
            navigator.clipboard.writeText(youtubeAnalysisResult).then(() => {
                setIsYTCopied(true);
                setTimeout(() => setIsYTCopied(false), 2000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
    };
    
    const handleCopyClonedStory = () => {
        if (clonedStoryOutput) {
            navigator.clipboard.writeText(clonedStoryOutput).then(() => {
                setIsStoryCopied(true);
                setTimeout(() => setIsStoryCopied(false), 2000);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }
    };
    
    const handleCopyScenePrompt = (promptText: string, sceneIndex: number) => {
        navigator.clipboard.writeText(promptText).then(() => {
            setCopiedScenePrompts(prev => ({ ...prev, [sceneIndex]: true }));
            setTimeout(() => {
                setCopiedScenePrompts(prev => ({ ...prev, [sceneIndex]: false }));
            }, 2000);
        }).catch(err => {
            console.error('Could not copy scene prompt: ', err);
        });
    };

    const handleDownloadStoryboardPrompts = () => {
        if (!videoStoryboardResult || !videoStoryboardResult.scenes) return;

        // Join all prompts with a double newline for a blank line between them
        const allPrompts = videoStoryboardResult.scenes
            .map(scene => scene.prompt)
            .join('\n\n');

        // Create a blob from the prompts string
        const blob = new Blob([allPrompts], { type: 'text/plain;charset=utf-8' });

        // Create a link element to trigger the download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        // Sanitize title for filename
        const fileName = (videoStoryboardResult.title || 'storyboard').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${fileName}_prompts.txt`;

        // Append to the DOM, click, and then remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(link.href);
    };

    const playScene = (index: number, playlist: StoryboardAudio[]) => {
        if (index >= playlist.length) {
            setCurrentlyPlaying(null);
            return;
        }
        const sceneNumber = playlist[index].scene;
        setCurrentlyPlaying(sceneNumber);
        const audioEl = audioRefs.current.get(sceneNumber);

        if (audioEl) {
            audioEl.onended = () => playScene(index + 1, playlist);
            audioEl.play().catch(e => {
                console.error("Playback failed for scene", sceneNumber, e);
                playScene(index + 1, playlist); // Try next one on error
            });
        } else {
            // Skip if element not found and play next
            playScene(index + 1, playlist);
        }
    };

    const handlePlayAll = () => {
        if (!storyboardAudio || storyboardAudio.length === 0) return;
        const sortedAudio = [...storyboardAudio].sort((a, b) => a.scene - b.scene);
        playScene(0, sortedAudio);
    };


    const handleImageDeleteAndClose = (index: number) => {
        onImageDelete(index);
        if (generatedImages.length <= 1) {
            setSelectedImageIndex(null); 
        } else if (selectedImageIndex === generatedImages.length - 1) {
             setSelectedImageIndex(selectedImageIndex - 1);
        }
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedImageIndex === null || generatedImages.length === 0) return;
        setSelectedImageIndex((prevIndex) => (prevIndex! + 1) % generatedImages.length);
    };

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedImageIndex === null || generatedImages.length === 0) return;
        setSelectedImageIndex((prevIndex) => (prevIndex! - 1 + generatedImages.length) % generatedImages.length);
    };


    if (isLoading && !hasContent) {
        return (
            <div className="mt-8 text-center">
                <div className="inline-block"><Spinner /></div>
                <p className="text-indigo-300 mt-2">{loadingMessage}</p>
            </div>
        );
    }
    
    if (!hasContent && !hasError) {
        return null;
    }
    
    return (
        <div className="mt-8 space-y-8">
            {isLoading && (
                 <div className="mt-8 text-center sticky top-24 z-20">
                    <div className="inline-block bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
                        <Spinner />
                        <p className="text-indigo-300 mt-4 whitespace-pre-wrap">{loadingMessage}</p>
                    </div>
                </div>
            )}

            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>}
            
            {hasYouTubeScriptContent && (
                 <div className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-2xl border border-slate-700/80 animate-fade-in">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-white">
                            <i className="fa-brands fa-youtube mr-2 text-red-500"></i>
                            Kịch bản YouTube
                        </h2>
                    </div>
                    <div className="space-y-6">
                        {/* Metadata Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Titles */}
                             <div className="space-y-2">
                                <h3 className="font-semibold text-indigo-300">Tiêu đề gợi ý</h3>
                                <ul className="space-y-2">
                                    {youtubeScriptResult.titles.map((title, index) => (
                                        <li key={index} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-md">
                                            <span className="flex-grow text-slate-300 text-sm">{title}</span>
                                            <CopyButton textToCopy={title} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                             {/* Descriptions */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-indigo-300">Mô tả gợi ý</h3>
                                 <ul className="space-y-2">
                                    {youtubeScriptResult.descriptions.map((desc, index) => (
                                        <li key={index} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-md">
                                            <p className="flex-grow text-slate-400 text-xs">{desc}</p>
                                            <CopyButton textToCopy={desc} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Hook */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-indigo-300">Hook mở đầu (15-25s)</h3>
                                 <div className="bg-slate-900/60 p-3 rounded-md">
                                    <pre className="whitespace-pre-wrap font-sans text-slate-300 text-sm leading-relaxed">{youtubeScriptResult.hook}</pre>
                                    <div className="text-right mt-2">
                                         <CopyButton textToCopy={youtubeScriptResult.hook} />
                                    </div>
                                </div>
                            </div>
                             {/* Thumbnails */}
                            <div className="space-y-2">
                                <h3 className="font-semibold text-indigo-300">Caption cho Thumbnail</h3>
                                <ul className="space-y-2">
                                    {youtubeScriptResult.thumbnail_captions.map((cap, index) => (
                                        <li key={index} className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-md">
                                            <span className="flex-grow text-white text-sm font-bold tracking-wider">{cap}</span>
                                            <CopyButton textToCopy={cap} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Story Parts Section */}
                        <div className="space-y-2 pt-4 border-t border-slate-700/50">
                             <h3 className="font-semibold text-indigo-300">Nội dung câu chuyện (7 Phần)</h3>
                            {youtubeScriptResult.story_parts.map((part, index) => (
                                <details key={index} className="bg-slate-900/50 rounded-lg border border-slate-700">
                                    <summary className="p-3 font-semibold text-white cursor-pointer hover:bg-slate-800/50 rounded-t-lg flex justify-between items-center">
                                        Phần {index + 1}
                                        <CopyButton textToCopy={part} />
                                    </summary>
                                    <div className="p-4 border-t border-slate-700">
                                        <pre className="whitespace-pre-wrap font-sans text-slate-300 text-sm leading-relaxed">{part}</pre>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>
                 </div>
            )}

            {hasClonedStoryContent && (
                 <div className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-2xl border border-slate-700/80 animate-fade-in">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-white">
                            <i className="fa-solid fa-book-sparkles mr-2"></i>
                            Truyện Mới
                        </h2>
                        <button
                            onClick={handleCopyClonedStory}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <i className={`fa-solid ${isStoryCopied ? 'fa-check' : 'fa-copy'}`}></i>
                            <span>{isStoryCopied ? 'Đã sao chép!' : 'Sao chép'}</span>
                        </button>
                    </div>
                    <pre className="whitespace-pre-wrap bg-slate-900/60 p-4 rounded-lg font-sans text-slate-300 text-sm leading-relaxed overflow-x-auto">
                        {clonedStoryOutput}
                    </pre>
                </div>
            )}

            {hasClonedVoiceContent && (
                <div className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-2xl border border-slate-700/80 animate-fade-in">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-white">
                            <i className="fa-solid fa-user-astronaut mr-2"></i>
                            Kết quả Sao chép Giọng nói
                        </h2>
                         <a 
                            href={clonedVoiceOutputUrl}
                            download={`pidtap-studio-cloned-voice.wav`}
                            title="Tải âm thanh"
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            <i className="fa-solid fa-download"></i>
                            <span>Tải về (WAV)</span>
                        </a>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <audio
                            controls
                            src={clonedVoiceOutputUrl}
                            className="w-full"
                        />
                    </div>
                </div>
            )}
            
            {hasStoryboardContent && (
                <div className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-2xl border border-slate-700/80">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <h2 className="text-xl font-bold text-white">
                            <i className="fa-solid fa-clapperboard mr-2"></i>
                            Video Storyboard
                        </h2>
                         <div className="flex items-center flex-wrap gap-2">
                            <button
                                onClick={handleDownloadStoryboardPrompts}
                                className="px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                            >
                                <i className="fa-solid fa-download"></i>
                                <span>Tải Prompts</span>
                            </button>
                            {storyboardAudio && storyboardAudio.length > 0 && (
                                <button
                                    onClick={onMergeAndDownloadStoryboardAudio}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    <i className="fa-solid fa-file-zipper"></i>
                                    <span>Tải File Gộp (WAV)</span>
                                </button>
                            )}
                             <button
                                onClick={onGenerateTTSFromStoryboard}
                                disabled={isLoading}
                                className="px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-500 transition-colors flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-microphone-lines"></i>
                                <span>Tạo Âm thanh (TTS)</span>
                            </button>
                             <button
                                onClick={onGenerateVideoFromStoryboard}
                                disabled={isLoading}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-video"></i>
                                <span>Tạo Video</span>
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-indigo-300">Title</h3>
                            <p className="text-slate-200">{videoStoryboardResult.title}</p>
                        </div>
                         <div>
                            <h3 className="font-semibold text-indigo-300">Logline</h3>
                            <p className="text-slate-300 italic text-sm">{videoStoryboardResult.logline}</p>
                        </div>
                        <div>
                            <div className="flex flex-wrap gap-4 justify-between items-center mb-2">
                                <h3 className="font-semibold text-indigo-300">Scenes & Prompts</h3>
                                {storyboardAudio && storyboardAudio.length > 0 && (
                                     <button
                                        onClick={handlePlayAll}
                                        disabled={isLoading || currentlyPlaying !== null}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
                                    >
                                        <i className={`fa-solid ${currentlyPlaying !== null ? 'fa-pause' : 'fa-play'}`}></i>
                                        <span>{currentlyPlaying !== null ? 'Đang phát...' : 'Phát tất cả'}</span>
                                    </button>
                                )}
                            </div>
                             <div className="space-y-4">
                                {videoStoryboardResult.scenes.map((scene, index) => {
                                    const sceneAudio = storyboardAudio?.find(audio => audio.scene === scene.scene);
                                    const isPlaying = currentlyPlaying === scene.scene;

                                    return (
                                        <div key={index} className={`bg-slate-900/50 p-4 rounded-lg border-2 space-y-3 transition-colors ${isPlaying ? 'border-indigo-500' : 'border-slate-700'}`}>
                                            <h4 className="font-bold text-white">Scene {scene.scene}: <span className="font-normal">{scene.description}</span></h4>
                                            
                                            <div>
                                                <h5 className="font-semibold text-indigo-400 text-sm">Narration:</h5>
                                                <blockquote className="border-l-4 border-slate-600 pl-3 text-slate-300 italic text-sm mt-1">
                                                    {scene.narration}
                                                </blockquote>
                                            </div>

                                            {sceneAudio && (
                                                <div className="pt-2 flex items-center gap-3">
                                                    <audio
                                                        ref={(el) => {
                                                            if (el) audioRefs.current.set(scene.scene, el);
                                                            else audioRefs.current.delete(scene.scene);
                                                        }}
                                                        controls
                                                        src={sceneAudio.url}
                                                        className="w-full h-8"
                                                        onPlay={() => setCurrentlyPlaying(scene.scene)}
                                                        onPause={() => setCurrentlyPlaying(p => p === scene.scene ? null : p)}
                                                        onEnded={() => setCurrentlyPlaying(p => p === scene.scene ? null : p)}
                                                    />
                                                    <a 
                                                        href={sceneAudio.url}
                                                        download={`pidtap-storyboard-scene-${scene.scene}.wav`}
                                                        title="Tải âm thanh cảnh này"
                                                        className="flex-shrink-0 w-8 h-8 bg-slate-700 hover:bg-indigo-600 rounded-md transition-colors text-white flex items-center justify-center"
                                                    >
                                                        <i className="fa-solid fa-download"></i>
                                                    </a>
                                                </div>
                                            )}

                                            <div className="relative">
                                                <h5 className="font-semibold text-indigo-400 text-sm mb-1">Recreation Prompt:</h5>
                                                <pre className="whitespace-pre-wrap bg-slate-800 p-3 pr-24 rounded font-mono text-slate-400 text-xs leading-relaxed overflow-x-auto">
                                                    {scene.prompt}
                                                </pre>
                                                <button
                                                    onClick={() => handleCopyScenePrompt(scene.prompt, index)}
                                                    className="absolute top-8 right-2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                                >
                                                    <i className={`fa-solid ${copiedScenePrompts[index] ? 'fa-check' : 'fa-copy'}`}></i>
                                                    <span>{copiedScenePrompts[index] ? 'Copied!' : 'Copy'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {hasYTContent && (
                <div className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-2xl border border-slate-700/80">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">
                            <i className="fa-solid fa-magnifying-glass-chart mr-2"></i>
                            Báo cáo Phân tích Kênh YouTube
                        </h2>
                        <button
                            onClick={handleCopyYTAnalysis}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <i className={`fa-solid ${isYTCopied ? 'fa-check' : 'fa-copy'}`}></i>
                            <span>{isYTCopied ? 'Đã sao chép!' : 'Sao chép'}</span>
                        </button>
                    </div>
                    <pre className="whitespace-pre-wrap bg-slate-900/60 p-4 rounded-lg font-sans text-slate-300 text-sm leading-relaxed overflow-x-auto">
                        {youtubeAnalysisResult}
                    </pre>
                </div>
            )}
            
            {hasVideoContent && (
                <div className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-2xl border border-slate-700/80">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">
                            <i className="fa-solid fa-film mr-2"></i>
                            Video được tạo
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {generatedVideoUrls.map((videoUrl, index) => (
                            <div key={index} className="relative group aspect-video bg-black rounded-lg overflow-hidden border border-slate-700">
                                <video
                                    src={videoUrl}
                                    controls
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={videoUrl}
                                        download={`pidtap-studio-video-${Date.now()}-${index}.mp4`}
                                        title="Tải video"
                                        className="w-8 h-8 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-download text-sm"></i>
                                    </a>
                                    <button
                                        onClick={() => onOpenVideoEditor(videoUrl, index)}
                                        title="Chỉnh sửa video"
                                        className="w-8 h-8 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-wand-magic-sparkles text-sm"></i>
                                    </button>
                                    <button
                                        onClick={() => onVideoDelete(index)}
                                        title="Xóa video"
                                        className="w-8 h-8 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-trash-can text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {hasVideoPromptContent && (
                <div className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-2xl border border-slate-700/80">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">
                            <i className="fa-solid fa-pen-ruler mr-2"></i>
                            Prompt Video được tạo
                        </h2>
                        <button
                            onClick={handleCopyPrompt}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-copy'}`}></i>
                            <span>{isCopied ? 'Đã sao chép!' : 'Sao chép'}</span>
                        </button>
                    </div>
                    <pre className="whitespace-pre-wrap bg-slate-900/60 p-4 rounded-lg font-mono text-slate-300 text-sm leading-relaxed overflow-x-auto">
                        {videoPromptOutput}
                    </pre>
                </div>
            )}

            {hasImageContent && (
                 <div className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-2xl border border-slate-700/80">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Kết quả Sáng tạo</h2>
                        <button
                            onClick={handleDownloadAll}
                            disabled={generatedImages.length === 0}
                            title="Tải xuống tất cả ảnh"
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <i className="fa-solid fa-cloud-download"></i>
                            <span>Tải tất cả</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {generatedImages.map((image, index) => (
                             <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-transform duration-300 transform hover:scale-105">
                                <img 
                                    src={`data:image/png;base64,${image.src}`} 
                                    alt={`Generated image ${index + 1}`} 
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setSelectedImageIndex(index)}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-center text-xs text-white font-mono">
                                    {image.resolution}
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedImageIndex !== null && generatedImages[selectedImageIndex] && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-lg" onClick={() => setSelectedImageIndex(null)}>
                    <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        
                        {generatedImages.length > 1 && (
                            <button onClick={handlePrevImage} className="absolute left-2 md:left-4 z-10 text-white bg-slate-900/50 hover:bg-slate-900/80 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition">
                                <i className="fa-solid fa-chevron-left"></i>
                            </button>
                        )}
                        
                        <div className="relative max-w-4xl max-h-[90vh]">
                             <img 
                                src={`data:image/png;base64,${generatedImages[selectedImageIndex].src}`} 
                                alt="Enlarged view" 
                                className="block max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                            />
                             
                            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-12 rounded-b-lg">
                                <a 
                                    href={`data:image/png;base64,${generatedImages[selectedImageIndex].src}`} 
                                    download={`pidtap-studio-${Date.now()}-${selectedImageIndex}.png`} 
                                    title="Tải xuống" 
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900/50 backdrop-blur-sm text-white rounded-lg hover:bg-indigo-600 transition-all duration-300"
                                >
                                    <i className="fa-solid fa-download"></i>
                                    <span className="hidden sm:inline">Tải xuống</span>
                                </a>
                                <>
                                    <button 
                                        onClick={() => { onSetImageForAIGen(`data:image/png;base64,${generatedImages[selectedImageIndex].src}`); setSelectedImageIndex(null); }} 
                                        title="Dùng ảnh này để chỉnh sửa tiếp" 
                                        className="flex items-center gap-2 px-5 py-3 text-base font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 ring-2 ring-indigo-500/50 transform hover:scale-105"
                                    >
                                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                                        <span className="hidden sm:inline">Chỉnh sửa AI</span>
                                    </button>
                                    <button 
                                        onClick={() => handleImageDeleteAndClose(selectedImageIndex)} 
                                        title="Xóa" 
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-900/50 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 transition-all duration-300"
                                    >
                                        <i className="fa-solid fa-trash-can"></i>
                                        <span className="hidden sm:inline">Xóa</span>
                                    </button>
                                </>
                            </div>
                        </div>

                        {generatedImages.length > 1 && (
                            <button onClick={handleNextImage} className="absolute right-2 md:right-4 z-10 text-white bg-slate-900/50 hover:bg-slate-900/80 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition">
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        )}
                        
                        <button className="absolute top-4 right-4 text-white bg-slate-900/50 hover:bg-red-600 rounded-full w-10 h-10 flex items-center justify-center transition" onClick={() => setSelectedImageIndex(null)}><i className="fa-solid fa-times text-xl"></i></button>
                        
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/50 text-white px-3 py-1 rounded-full text-sm font-mono shadow-lg">
                           {selectedImageIndex + 1} / {generatedImages.length} | {generatedImages[selectedImageIndex].resolution}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OutputSection;