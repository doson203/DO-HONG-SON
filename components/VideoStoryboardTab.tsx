import React, { useState, useEffect } from 'react';
import { VideoStoryboardInputMode, TtsVoice } from '../types';
import { storyboardLanguages, voiceOptions } from '../constants';

interface VideoStoryboardTabProps {
    inputMode: VideoStoryboardInputMode;
    setInputMode: (mode: VideoStoryboardInputMode) => void;
    topic: string;
    setTopic: (topic: string) => void;
    duration: number;
    setDuration: (duration: number) => void;
    videoFile: File | null;
    setVideoFile: (file: File | null) => void;
    script: string;
    setScript: (script: string) => void;
    storyboardLanguage: string;
    setStoryboardLanguage: (language: string) => void;
    storyboardVoice: TtsVoice;
    setStoryboardVoice: (voice: TtsVoice) => void;
}

const durationOptions = [
    { value: 15, label: '15 giây', icon: 'fa-bolt' },
    { value: 30, label: '30 giây', icon: 'fa-person-running' },
    { value: 60, label: '60 giây', icon: 'fa-film' },
];

const VideoUploader: React.FC<{ videoFile: File | null; setVideoFile: (file: File | null) => void; }> = ({ videoFile, setVideoFile }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (videoFile) {
            const url = URL.createObjectURL(videoFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [videoFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setVideoFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const resetVideo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setVideoFile(null);
    };

    return (
        <div 
            className={`relative group w-full h-64 border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center text-slate-400 bg-slate-900/50 transition-all duration-300 hover:border-indigo-500 hover:text-indigo-400 cursor-pointer ${previewUrl ? 'border-indigo-500' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('storyboard-video-file-input')?.click()}
        >
            <input 
                type="file" 
                id="storyboard-video-file-input" 
                accept="video/*" 
                className="hidden"
                onChange={handleFileChange}
            />
            {previewUrl ? (
                <>
                    <video src={previewUrl} className="absolute inset-0 w-full h-full object-contain rounded-lg p-2" controls muted loop playsInline />
                    <button 
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 z-10" 
                        title="Xóa video" 
                        onClick={resetVideo}
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </>
            ) : (
                <div className="text-center">
                    <i className="fa-solid fa-cloud-arrow-up text-4xl mb-2"></i>
                    <p>Nhấn để chọn hoặc kéo thả video</p>
                </div>
            )}
        </div>
    );
};


const VideoStoryboardTab: React.FC<VideoStoryboardTabProps> = ({
    inputMode,
    setInputMode,
    topic,
    setTopic,
    duration,
    setDuration,
    videoFile,
    setVideoFile,
    script,
    setScript,
    storyboardLanguage,
    setStoryboardLanguage,
    storyboardVoice,
    setStoryboardVoice,
}) => {
    // Effect to detect video duration when in 'video' or 'script' mode
    useEffect(() => {
        if ((inputMode === 'video' || inputMode === 'script') && videoFile) {
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata';
            const url = URL.createObjectURL(videoFile);
            videoElement.src = url;

            const handleMetadata = () => {
                // Set duration, rounded to the nearest second
                setDuration(Math.round(videoElement.duration));
                URL.revokeObjectURL(url); // Clean up object URL
                videoElement.removeEventListener('loadedmetadata', handleMetadata);
            };
            
            videoElement.addEventListener('loadedmetadata', handleMetadata);

            videoElement.onerror = () => {
                console.error("Error loading video metadata.");
                URL.revokeObjectURL(url); // Clean up on error
            };

            // Cleanup function to run if component unmounts or dependencies change
            return () => {
                URL.revokeObjectURL(url);
                videoElement.removeEventListener('loadedmetadata', handleMetadata);
            };
        }
    }, [videoFile, inputMode, setDuration]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numberValue = parseInt(value, 10);
        
        if (value === '') {
            // Set to 0 to indicate an empty/invalid state which clears presets
            setDuration(0);
        } else if (!isNaN(numberValue) && numberValue > 0) {
            setDuration(numberValue);
        }
    };
    
    const isDurationAutoDetected = (inputMode === 'script' && !!videoFile) || inputMode === 'video';
    // A duration is "custom" if it's not one of the preset options.
    const isCustomDuration = !durationOptions.some(option => option.value === duration);

    return (
        <div className="space-y-8">
            <div className="flex bg-slate-800/70 border border-slate-700 rounded-lg p-1 w-full max-w-lg">
                <button 
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${inputMode === 'topic' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                    onClick={() => setInputMode('topic')}
                    aria-pressed={inputMode === 'topic'}
                >
                    <i className="fa-solid fa-lightbulb mr-2"></i> Từ Chủ đề
                </button>
                <button 
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${inputMode === 'video' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                    onClick={() => setInputMode('video')}
                    aria-pressed={inputMode === 'video'}
                >
                    <i className="fa-solid fa-video-slash mr-2"></i> Phân tích Video
                </button>
                 <button 
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${inputMode === 'script' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                    onClick={() => setInputMode('script')}
                    aria-pressed={inputMode === 'script'}
                >
                    <i className="fa-solid fa-file-video mr-2"></i> Kịch bản & Phong cách
                </button>
            </div>

            {inputMode === 'topic' && (
                 <div className="animate-fade-in">
                    <label htmlFor="video-storyboard-topic" className="block text-sm font-medium text-slate-300 mb-2">
                        <i className="fa-solid fa-lightbulb mr-2 text-indigo-400"></i>
                        Nhập chủ đề hoặc ý tưởng cho video của bạn:
                    </label>
                    <textarea
                        id="video-storyboard-topic"
                        rows={4}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        placeholder="Ví dụ: một câu chuyện ngắn về một chú robot nhỏ bé khám phá một khu rừng kỳ ảo..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    ></textarea>
                </div>
            )} 
            
            {inputMode === 'video' && (
                <div className="animate-fade-in space-y-4">
                    <label className="block text-sm font-medium text-slate-300">
                        <i className="fa-solid fa-upload mr-2 text-indigo-400"></i>
                        Tải lên video để AI phân tích và viết kịch bản:
                    </label>
                    <VideoUploader videoFile={videoFile} setVideoFile={setVideoFile} />
                </div>
            )}

            {inputMode === 'script' && (
                <div className="animate-fade-in space-y-6">
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                           <i className="fa-solid fa-camera-retro mr-2 text-indigo-400"></i>
                           1. Tải lên video tham chiếu (Phong cách & Edit, tùy chọn):
                       </label>
                       <VideoUploader videoFile={videoFile} setVideoFile={setVideoFile} />
                       <p className="text-xs text-slate-500 mt-2">Video này sẽ được dùng để AI học theo phong cách hình ảnh, màu sắc và edit. Nếu để trống, AI sẽ tự sáng tạo phong cách.</p>
                   </div>
                     <div>
                        <label htmlFor="video-storyboard-script" className="block text-sm font-medium text-slate-300 mb-2">
                            <i className="fa-solid fa-file-lines mr-2 text-indigo-400"></i>
                            2. Dán kịch bản của bạn vào đây (Nội dung chính):
                        </label>
                        <textarea
                            id="video-storyboard-script"
                            rows={8}
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-mono text-sm"
                            placeholder={`Ví dụ:\nCẢNH 1: NỘI. PHÒNG THÍ NGHIỆM - NGÀY\nMột nhà khoa học đang kiểm tra một ống nghiệm phát sáng.\n\nNHÀ KHOA HỌC\n(thì thầm)\nNó hoạt động rồi...`}
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                        ></textarea>
                    </div>
                </div>
            )}
           
             <div className="space-y-6 pt-6 border-t border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="storyboard-language-selector" className="block text-sm font-medium text-slate-300 mb-2">
                            <i className="fa-solid fa-language mr-2 text-indigo-400"></i>
                            Chọn ngôn ngữ cho kịch bản:
                        </label>
                        <select
                            id="storyboard-language-selector"
                            value={storyboardLanguage}
                            onChange={(e) => setStoryboardLanguage(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        >
                            {storyboardLanguages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="storyboard-voice-selector" className="block text-sm font-medium text-slate-300 mb-2">
                            <i className="fa-solid fa-microphone-lines mr-2 text-indigo-400"></i>
                            Chọn giọng đọc cho kịch bản:
                        </label>
                        <select
                            id="storyboard-voice-selector"
                            value={storyboardVoice}
                            onChange={(e) => setStoryboardVoice(e.target.value as TtsVoice)}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        >
                            {voiceOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.name} - {opt.description.split('.')[0]}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Duration Selector */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        <i className="fa-solid fa-clock mr-2 text-indigo-400"></i>
                        {isDurationAutoDetected ? 'Thời lượng video (tự động):' : 'Chọn hoặc nhập thời lượng:'}
                    </label>
                    {isDurationAutoDetected ? (
                         <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white font-semibold">
                            {duration > 0 ? `${duration} giây` : 'Đang nhận diện...'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {durationOptions.map((option) => (
                                <label key={option.value} className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer ${duration === option.value ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                                    <input
                                        type="radio"
                                        name="duration"
                                        value={option.value}
                                        checked={duration === option.value}
                                        onChange={() => setDuration(option.value)}
                                        className="sr-only" // Hide the actual radio button
                                    />
                                    <div className="flex items-center justify-center gap-3">
                                        <i className={`${option.icon} text-lg ${duration === option.value ? 'text-indigo-400' : 'text-slate-400'}`}></i>
                                        <span className={`font-semibold ${duration === option.value ? 'text-white' : 'text-slate-300'}`}>{option.label}</span>
                                    </div>
                                </label>
                            ))}
                            {/* Custom Input */}
                            <div className={`relative flex items-center rounded-lg border-2 transition-all ${isCustomDuration && duration > 0 ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                                <div className="pl-3 pointer-events-none">
                                    <i className={`fa-solid fa-stopwatch text-lg ${isCustomDuration && duration > 0 ? 'text-indigo-400' : 'text-slate-400'}`}></i>
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    value={duration > 0 ? duration : ''}
                                    onChange={handleInputChange}
                                    placeholder="Tùy chỉnh"
                                    className="w-full bg-transparent text-white font-semibold focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-3 pl-2"
                                />
                                <span className={`pr-3 font-semibold pointer-events-none ${isCustomDuration && duration > 0 ? 'text-white' : 'text-slate-300'}`}>giây</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoStoryboardTab;