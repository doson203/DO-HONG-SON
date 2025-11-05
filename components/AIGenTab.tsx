import React, { useState, useEffect } from 'react';

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
                className={`relative group w-full h-48 border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center text-slate-400  transition-all duration-300 hover:border-indigo-500 hover:text-indigo-400 cursor-pointer ${previewUrl ? 'border-indigo-500' : ''}`}
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


interface AIGenTabProps {
    subjectImageFile: File | null;
    setSubjectImageFile: (file: File | null) => void;
    customPrompt: string;
    setCustomPrompt: (prompt: string) => void;
}

const AIGenTab: React.FC<AIGenTabProps> = (props) => {
    const { 
        subjectImageFile, setSubjectImageFile,
        customPrompt, setCustomPrompt,
    } = props;

    return (
        <div className="space-y-8">
            {/* Image Uploader */}
            <div>
                <ImageUploader 
                    id="subject-image-input"
                    label="Ảnh để chỉnh sửa"
                    imageFile={subjectImageFile}
                    setImageFile={setSubjectImageFile}
                />
            </div>

            {/* Prompt Input */}
            <div>
                <label htmlFor="custom-prompt-input" className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-terminal mr-2 text-indigo-400"></i>Nhập yêu cầu tùy chỉnh cho AI:
                </label>
                <textarea 
                    id="custom-prompt-input" 
                    rows={4} 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    placeholder="Ví dụ: 'thêm một chiếc mũ cao bồi cho người trong ảnh', 'biến nền thành một bãi biển vào lúc hoàng hôn', 'thay đổi màu áo thành màu đỏ'."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                ></textarea>
                 <p className="text-xs text-slate-500 mt-2">
                    Mô tả càng chi tiết, kết quả AI trả về sẽ càng chính xác.
                </p>
            </div>
        </div>
    );
};

export default AIGenTab;
