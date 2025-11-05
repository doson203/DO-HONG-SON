import React from 'react';
import TechOptionsSelector from './TechOptionsSelector';
import { TechOptions, ImageAnalysisMode } from '../types';

interface ImageTabProps {
    imageFile: File | null;
    setImageFile: (file: File | null) => void;
    techOptions: TechOptions;
    setTechOptions: (options: TechOptions) => void;
    analysisMode: ImageAnalysisMode;
    setAnalysisMode: (mode: ImageAnalysisMode) => void;
}

const ImageTab: React.FC<ImageTabProps> = ({ imageFile, setImageFile, techOptions, setTechOptions, analysisMode, setAnalysisMode }) => {
    
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

    const previewUrl = imageFile ? URL.createObjectURL(imageFile) : null;

    return (
        <div className="space-y-6">
            <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-upload mr-2 text-indigo-400"></i>Tải lên một ảnh để AI phân tích:
                </label>
                <div 
                    className={`relative group w-full h-48 border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center text-slate-400 transition-all duration-300 hover:border-indigo-500 hover:text-indigo-400 cursor-pointer ${previewUrl ? 'border-indigo-500' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('image-file-input')?.click()}
                >
                    <input 
                        type="file" 
                        id="image-file-input" 
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
                            <p>Nhấn để chọn hoặc kéo thả ảnh</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">
                    Chế độ phân tích:
                </label>
                <div className="flex bg-slate-800/70 border border-slate-700 rounded-lg p-1 w-full max-w-xs">
                    <button 
                        className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${analysisMode === 'freestyle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                        onClick={() => setAnalysisMode('freestyle')}
                    >
                        <i className="fa-solid fa-brain mr-2"></i> Tự Do
                    </button>
                    <button 
                        className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${analysisMode === 'focused' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                        onClick={() => setAnalysisMode('focused')}
                    >
                        <i className="fa-solid fa-crosshairs mr-2"></i> Tập Trung
                    </button>
                </div>
                 <p className="text-xs text-slate-500 mt-2">
                    {analysisMode === 'freestyle' 
                        ? 'AI sẽ phân tích khách quan tất cả các chi tiết trong ảnh.' 
                        : 'AI sẽ tự động xác định chủ đề và phân tích chuyên sâu theo cấu trúc đó.'}
                </p>
            </div>
            
            <TechOptionsSelector
                techOptions={techOptions}
                setTechOptions={setTechOptions}
            />
        </div>
    );
};

export default ImageTab;
