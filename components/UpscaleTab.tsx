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
             <label className="block text-sm font-medium text-slate-300 mb-2">
                {label}:
            </label>
            <div 
                className={`relative group w-full h-64 border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center text-slate-400 transition-all duration-300 hover:border-indigo-500 hover:text-indigo-400 cursor-pointer ${previewUrl ? 'border-indigo-500' : ''}`}
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
                        <p>Nhấn để chọn hoặc kéo thả ảnh</p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface UpscaleTabProps {
    upscaleImageFile: File | null;
    setUpscaleImageFile: (file: File | null) => void;
}

const UpscaleTab: React.FC<UpscaleTabProps> = ({
    upscaleImageFile,
    setUpscaleImageFile,
}) => {
    const [resolutionInfo, setResolutionInfo] = useState<string | null>(null);
    const [resolutionWarning, setResolutionWarning] = useState<string | null>(null);

    useEffect(() => {
        // Reset states when the file changes
        setResolutionInfo(null);
        setResolutionWarning(null);

        if (upscaleImageFile) {
            const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        URL.revokeObjectURL(img.src); // Clean up memory
                        resolve({ width: img.naturalWidth, height: img.naturalHeight });
                    };
                    img.onerror = (err) => {
                         URL.revokeObjectURL(img.src); // Clean up memory on error
                        reject(err);
                    };
                    img.src = URL.createObjectURL(file);
                });
            };

            getImageDimensions(upscaleImageFile)
                .then(({ width, height }) => {
                    setResolutionInfo(`Ảnh bạn upload có độ phân giải là: ${width} x ${height}`);
                    // Warn if the image is larger than the optimal processing size for the AI
                    if (width > 1024 || height > 1024) {
                        setResolutionWarning('Cảnh báo: Ảnh có độ phân giải cao và sẽ được tự động thu nhỏ để AI xử lý, điều này có thể ảnh hưởng đến chất lượng upscale cuối cùng.');
                    }
                })
                .catch(err => {
                    console.error("Could not get image dimensions:", err);
                    setResolutionInfo("Không thể đọc độ phân giải của ảnh.");
                });
        }
    }, [upscaleImageFile]);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-white">Upscale Ảnh - Tăng độ phân giải</h3>
                <p className="text-sm text-slate-400 mt-1">AI sẽ tăng cường độ phân giải và độ sắc nét của ảnh.</p>
            </div>
            <div className="max-w-md mx-auto">
                 <ImageUploader
                    id="upscale-image-input"
                    label="Tải lên ảnh cần tăng độ phân giải"
                    imageFile={upscaleImageFile}
                    setImageFile={setUpscaleImageFile}
                />
                {resolutionInfo && (
                    <p className="text-center text-sm text-slate-400 mt-3 animate-fade-in">
                        <i className="fa-solid fa-ruler-combined mr-2"></i>
                        {resolutionInfo}
                    </p>
                )}
                {resolutionWarning && (
                     <p className="text-center text-sm text-yellow-400 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg animate-fade-in">
                        <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                        {resolutionWarning}
                    </p>
                )}
            </div>
        </div>
    );
};

export default UpscaleTab;
