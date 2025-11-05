import React, { useState, useEffect } from 'react';

// Re-using the ImageUploader component structure for consistency.
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
             <label className="block text-sm font-medium text-gray-300 mb-2">
                {label}:
            </label>
            <div 
                className={`relative group w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex flex-col justify-center items-center text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-all duration-300 cursor-pointer ${previewUrl ? 'border-indigo-500' : ''}`}
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


interface FaceSwapTabProps {
    sourceImageFile: File | null;
    setSourceImageFile: (file: File | null) => void;
    targetImageFile: File | null;
    setTargetImageFile: (file: File | null) => void;
}

const FaceSwapTab: React.FC<FaceSwapTabProps> = ({
    sourceImageFile,
    setSourceImageFile,
    targetImageFile,
    setTargetImageFile,
}) => {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-white">Hoán đổi Gương mặt</h3>
                <p className="text-sm text-gray-400 mt-1">Tải lên ảnh gốc (chứa mặt) và ảnh đích (nơi ghép vào).</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploader
                    id="source-image-input"
                    label="Ảnh Gốc (chứa gương mặt muốn dùng)"
                    imageFile={sourceImageFile}
                    setImageFile={setSourceImageFile}
                />
                <ImageUploader
                    id="target-image-input"
                    label="Ảnh Đích (nơi sẽ ghép mặt vào)"
                    imageFile={targetImageFile}
                    setImageFile={setTargetImageFile}
                />
            </div>
        </div>
    );
};

export default FaceSwapTab;