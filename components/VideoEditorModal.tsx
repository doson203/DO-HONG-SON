import React, { useState, useRef, useEffect } from 'react';
import { VideoEffect } from '../types';
import Spinner from './Spinner';

interface VideoEditorModalProps {
    videoUrl: string;
    onClose: () => void;
    onSave: (newVideoUrl: string) => void;
}

const effectOptions: { id: VideoEffect, label: string, filter: string }[] = [
    { id: 'none', label: 'Bản gốc', filter: 'none' },
    { id: 'grayscale', label: 'Trắng đen', filter: 'grayscale(100%)' },
    { id: 'sepia', label: 'Nâu đỏ', filter: 'sepia(100%)' },
    { id: 'invert', label: 'Âm bản', filter: 'invert(100%)' },
    { id: 'brightness', label: 'Tăng sáng', filter: 'brightness(130%)' },
];

const cropOptions: { id: string, label: string, value: number }[] = [
    { id: 'original', label: 'Gốc', value: 0 },
    { id: '1:1', label: '1:1', value: 1 / 1 },
    { id: '16:9', label: '16:9', value: 16 / 9 },
    { id: '9:16', label: '9:16', value: 9 / 16 },
];


const VideoEditorModal: React.FC<VideoEditorModalProps> = ({ videoUrl, onClose, onSave }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'crop' | 'effects'>('crop');
    
    // Editing state
    const [selectedEffect, setSelectedEffect] = useState<VideoEffect>('none');
    const [selectedCrop, setSelectedCrop] = useState<string>('original');
    
    const videoRef = useRef<HTMLVideoElement>(null);

    const getCssFilter = (effect: VideoEffect): string => {
        return effectOptions.find(e => e.id === effect)?.filter || 'none';
    };

    const handleExport = async () => {
        const video = document.createElement('video');
        video.src = videoUrl;
        
        setIsProcessing(true);
        setProcessingMessage('Đang tải siêu dữ liệu video...');

        video.onloadedmetadata = async () => {
            setProcessingMessage('Đang chuẩn bị để xử lý...');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                alert('Không thể khởi tạo trình chỉnh sửa.');
                setIsProcessing(false);
                return;
            }

            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            let targetWidth = videoWidth;
            let targetHeight = videoHeight;

            const cropRatio = cropOptions.find(c => c.id === selectedCrop)?.value;

            if (cropRatio && cropRatio > 0) {
                const videoRatio = videoWidth / videoHeight;
                if (videoRatio > cropRatio) { // Video is wider than target, crop sides
                    targetWidth = videoHeight * cropRatio;
                    targetHeight = videoHeight;
                } else { // Video is taller than target, crop top/bottom
                    targetHeight = videoWidth / cropRatio;
                    targetWidth = videoWidth;
                }
            }
            
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            const stream = canvas.captureStream();
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];

            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const newUrl = URL.createObjectURL(blob);
                onSave(newUrl);
                setIsProcessing(false);
            };

            recorder.start();
            
            video.currentTime = 0;
            await video.play();

            const processFrame = () => {
                if (video.paused || video.ended) {
                    recorder.stop();
                    setProcessingMessage('Hoàn tất!');
                    return;
                }
                
                const progress = (video.currentTime / video.duration) * 100;
                setProcessingMessage(`Đang xử lý... ${progress.toFixed(0)}%`);

                ctx.filter = getCssFilter(selectedEffect);
                
                const sx = (videoWidth - targetWidth) / 2;
                const sy = (videoHeight - targetHeight) / 2;

                ctx.drawImage(video, sx, sy, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);

                requestAnimationFrame(processFrame);
            };
            
            processFrame();
        };
        video.onerror = () => {
            alert('Không thể tải video để chỉnh sửa.');
            setIsProcessing(false);
        };
    };


    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-lg animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white"><i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Trình chỉnh sửa Video</h2>
                    <button onClick={onClose} disabled={isProcessing} className="text-slate-400 hover:text-white transition-colors disabled:opacity-50">
                        <i className="fa-solid fa-times text-2xl"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow flex flex-col md:flex-row min-h-0">
                    {/* Preview Panel */}
                    <div className="flex-grow bg-black flex items-center justify-center p-4 md:w-2/3">
                        <video
                            ref={videoRef}
                            key={videoUrl}
                            src={videoUrl}
                            controls
                            muted
                            loop
                            className="max-w-full max-h-full"
                            style={{ filter: getCssFilter(selectedEffect) }}
                        />
                    </div>

                    {/* Controls Panel */}
                    <div className="md:w-1/3 bg-slate-800/50 p-6 flex flex-col overflow-y-auto">
                         <div className="flex space-x-2 border-b border-slate-700 mb-6">
                            <button
                                onClick={() => setActiveTab('crop')}
                                className={`flex-1 text-center pb-2 font-semibold transition-colors ${activeTab === 'crop' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                            >
                                <i className="fa-solid fa-crop-simple mr-2"></i>Cắt
                            </button>
                            <button
                                onClick={() => setActiveTab('effects')}
                                className={`flex-1 text-center pb-2 font-semibold transition-colors ${activeTab === 'effects' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
                            >
                                <i className="fa-solid fa-palette mr-2"></i>Hiệu ứng
                            </button>
                        </div>

                        {isProcessing ? (
                             <div className="flex-grow flex flex-col items-center justify-center text-center">
                                <Spinner />
                                <p className="mt-4 text-indigo-300">{processingMessage}</p>
                                <p className="text-sm text-slate-400 mt-2">Vui lòng không đóng cửa sổ này.</p>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'crop' && (
                                    <div className="animate-fade-in">
                                        <h3 className="font-semibold text-slate-300 mb-3">Tỷ lệ khung hình</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {cropOptions.map(crop => (
                                                <button key={crop.id} onClick={() => setSelectedCrop(crop.id)} className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${selectedCrop === crop.id ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                                    {crop.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'effects' && (
                                    <div className="animate-fade-in">
                                        <h3 className="font-semibold text-slate-300 mb-3">Bộ lọc</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {effectOptions.map(effect => (
                                                <button key={effect.id} onClick={() => setSelectedEffect(effect.id)} className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${selectedEffect === effect.id ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-700 hover:bg-slate-600'}`}>
                                                    {effect.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 flex justify-end flex-shrink-0">
                    <button
                        onClick={handleExport}
                        disabled={isProcessing}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <i className="fa-solid fa-check"></i>
                        <span>Áp dụng & Xuất Video</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoEditorModal;
