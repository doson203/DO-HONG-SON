import React, { useState, useEffect } from 'react';
import { VeoModel, VideoResolution, VideoAspectRatio } from '../types';

interface ImageUploaderProps {
    id: string;
    label: string;
    imageFile: File | null;
    setImageFile: (file: File | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, imageFile, setImageFile }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [imageFile]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setImageFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const resetImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImageFile(null);
    };
    
    return (
        <div>
             <label className="block text-sm font-medium text-slate-300 mb-2">
                {label}:
            </label>
            <div 
                className={`relative group w-full h-48 border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center text-slate-400 transition-all duration-300 hover:border-indigo-500 hover:text-indigo-400 cursor-pointer ${previewUrl ? 'border-indigo-500' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById(id)?.click()}
            >
                <input 
                    type="file" 
                    id={id} 
                    accept="image/*" 
                    className="hidden"
                    onChange={handleFileChange}
                />
                {previewUrl ? (
                    <>
                        <img src={previewUrl} className="absolute inset-0 w-full h-full object-contain rounded-lg p-2" alt="Preview"/>
                        <button 
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 z-10" 
                            title="Xóa ảnh" 
                            onClick={resetImage}
                        >
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <i className="fa-solid fa-cloud-arrow-up text-4xl mb-2"></i>
                        <p>Nhấn để chọn hoặc kéo thả</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface VideoTabProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    inputImage: File | null;
    setInputImage: (file: File | null) => void;
    veoModel: VeoModel;
    setVeoModel: (model: VeoModel) => void;
    resolution: VideoResolution;
    setResolution: (res: VideoResolution) => void;
    videoAspectRatio: VideoAspectRatio;
    setVideoAspectRatio: (ratio: VideoAspectRatio) => void;
}

const VideoTab: React.FC<VideoTabProps> = ({ 
    prompt, setPrompt,
    inputImage, setInputImage,
    veoModel, setVeoModel,
    resolution, setResolution,
    videoAspectRatio, setVideoAspectRatio,
}) => {
    return (
        <div className="space-y-8">
            <div>
                <label htmlFor="video-idea-input" className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-pen-fancy mr-2 text-indigo-400"></i>
                    Nhập Prompt cho VEO 3:
                </label>
                <textarea 
                    id="video-idea-input" 
                    rows={5} 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-mono text-sm"
                    placeholder="e.g., A cinematic, hyper-detailed shot of a majestic lion walking across the Serengeti at sunset, golden hour lighting, epic wide angle, slow motion..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                ></textarea>
            </div>

            <div>
                <ImageUploader
                    id="video-image-input"
                    label="Ảnh đầu vào (tùy chọn)"
                    imageFile={inputImage}
                    setImageFile={setInputImage}
                />
                <p className="text-xs text-slate-500 mt-2">
                    Cung cấp ảnh để AI tạo video dựa trên nội dung và phong cách của ảnh đó.
                </p>
            </div>

            <div className="pt-6 border-t border-slate-700 space-y-6">
                <h3 className="text-base font-semibold text-slate-200">
                    <i className="fa-solid fa-sliders mr-2 text-indigo-400"></i>Cấu hình nâng cao
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Mô hình</label>
                        <div className="flex bg-slate-800/70 border border-slate-700 rounded-lg p-1 w-full">
                            <button 
                                className={`w-1/2 py-2 text-xs font-semibold rounded-md transition-all ${veoModel === 'veo-3.1-fast-generate-preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                                onClick={() => setVeoModel('veo-3.1-fast-generate-preview')}
                            >
                                Nhanh
                            </button>
                            <button 
                                className={`w-1/2 py-2 text-xs font-semibold rounded-md transition-all ${veoModel === 'veo-3.1-generate-preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                                onClick={() => setVeoModel('veo-3.1-generate-preview')}
                            >
                                Chất lượng cao
                            </button>
                        </div>
                    </div>
                    {/* Resolution Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Độ phân giải</label>
                        <div className="flex bg-slate-800/70 border border-slate-700 rounded-lg p-1 w-full">
                            <button 
                                className={`w-1/2 py-2 text-xs font-semibold rounded-md transition-all ${resolution === '720p' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                                onClick={() => setResolution('720p')}
                            >
                                720p
                            </button>
                            <button 
                                className={`w-1/2 py-2 text-xs font-semibold rounded-md transition-all ${resolution === '1080p' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                                onClick={() => setResolution('1080p')}
                            >
                                1080p
                            </button>
                        </div>
                    </div>
                    {/* Aspect Ratio Selection */}
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tỷ lệ</label>
                        <div className="flex bg-slate-800/70 border border-slate-700 rounded-lg p-1 w-full">
                            <button 
                                title="Ngang"
                                className={`w-1/2 py-2 text-xs font-semibold rounded-md transition-all ${videoAspectRatio === '16:9' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                                onClick={() => setVideoAspectRatio('16:9')}
                            >
                                <i className="fa-solid fa-rectangle-wide"></i> 16:9
                            </button>
                            <button 
                                title="Dọc"
                                className={`w-1/2 py-2 text-xs font-semibold rounded-md transition-all ${videoAspectRatio === '9:16' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                                onClick={() => setVideoAspectRatio('9:16')}
                            >
                                <i className="fa-solid fa-rectangle-portrait"></i> 9:16
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoTab;