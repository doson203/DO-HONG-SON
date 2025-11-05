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

interface RestoreTabProps {
    restoreImageFile: File | null;
    setRestoreImageFile: (file: File | null) => void;
    mode: 'single' | 'multiple';
    setMode: (mode: 'single' | 'multiple') => void;
    gender: 'male' | 'female' | '';
    setGender: (gender: 'male' | 'female' | '') => void;
    age: string;
    setAge: (age: string) => void;
    description: string;
    setDescription: (description: string) => void;
}

const RestoreTab: React.FC<RestoreTabProps> = ({
    restoreImageFile,
    setRestoreImageFile,
    mode, setMode,
    gender, setGender,
    age, setAge,
    description, setDescription,
}) => {
     // Reset description when mode changes to avoid confusion
    useEffect(() => {
        setDescription('');
    }, [mode, setDescription]);

    return (
        <div className="space-y-6">
            <div className="flex bg-slate-800/70 border border-slate-700 rounded-lg p-1 w-full max-w-sm">
                <button 
                    className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'single' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                    onClick={() => setMode('single')}
                    aria-pressed={mode === 'single'}
                >
                    <i className="fa-solid fa-user mr-2"></i> Một người
                </button>
                <button 
                    className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'multiple' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                    onClick={() => setMode('multiple')}
                    aria-pressed={mode === 'multiple'}
                >
                    <i className="fa-solid fa-users mr-2"></i> Nhiều người
                </button>
            </div>
            
             <ImageUploader
                id="restore-image-input"
                label="Tải lên ảnh cũ, mờ hoặc bị hỏng"
                imageFile={restoreImageFile}
                setImageFile={setRestoreImageFile}
            />

            {mode === 'single' && (
                <div className="space-y-4 pt-4 border-t border-slate-700 animate-fade-in">
                    <h3 className="text-base font-semibold text-slate-200">Thông tin bổ sung (giúp AI nhận diện tốt hơn)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="gender-selector" className="block text-sm font-medium text-slate-400 mb-1">Giới tính</label>
                             <select id="gender-selector" value={gender} onChange={(e) => setGender(e.target.value as any)} className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition">
                                <option value="">Không xác định</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                             </select>
                        </div>
                        <div>
                             <label htmlFor="age-input" className="block text-sm font-medium text-slate-400 mb-1">Độ tuổi ước tính</label>
                             <input type="text" id="age-input" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ví dụ: 25-30" className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="single-desc-input" className="block text-sm font-medium text-slate-400 mb-1">Mô tả thêm</label>
                        <textarea id="single-desc-input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ví dụ: người châu Á, tóc đen, mặc áo sơ mi..." className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"></textarea>
                    </div>
                </div>
            )}

            {mode === 'multiple' && (
                 <div className="space-y-4 pt-4 border-t border-slate-700 animate-fade-in">
                    <h3 className="text-base font-semibold text-slate-200">Thông tin bổ sung</h3>
                    <div>
                        <label htmlFor="multiple-desc-input" className="block text-sm font-medium text-slate-400 mb-1">Mô tả tổng quan bức ảnh</label>
                        <textarea id="multiple-desc-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ví dụ: có 10 người Việt Nam đang chụp ảnh kỷ niệm, ảnh chụp gia đình..." className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"></textarea>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestoreTab;
