import React from 'react';

interface CharacterCompositingTabProps {
    characterImages: File[];
    // FIX: Correctly type the state setter prop to accept an updater function.
    // This resolves errors where `prev` was implicitly `any`.
    setCharacterImages: React.Dispatch<React.SetStateAction<File[]>>;
    selectedIndices: number[];
    // FIX: Correctly type the state setter prop to accept an updater function.
    // This resolves errors where `prev` was implicitly `any`.
    setSelectedIndices: React.Dispatch<React.SetStateAction<number[]>>;
    backgroundImage: File | null;
    setBackgroundImage: (file: File | null) => void;
    description: string;
    setDescription: (text: string) => void;
}

const BackgroundUploader: React.FC<{ imageFile: File | null; setImageFile: (file: File | null) => void; }> = ({ imageFile, setImageFile }) => {
    const previewUrl = imageFile ? URL.createObjectURL(imageFile) : null;

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
        <div 
            className={`relative group w-full h-48 border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center text-slate-400 transition-all duration-300 hover:border-indigo-500 hover:text-indigo-400 cursor-pointer ${previewUrl ? 'border-indigo-500' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('background-image-input')?.click()}
        >
            <input 
                type="file" 
                id="background-image-input" 
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
    );
};


const CharacterCompositingTab: React.FC<CharacterCompositingTabProps> = ({
    characterImages,
    setCharacterImages,
    selectedIndices,
    setSelectedIndices,
    backgroundImage,
    setBackgroundImage,
    description,
    setDescription,
}) => {
    const maxFiles = 10;

    const handleCharacterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setCharacterImages(prev => [...prev, ...newFiles].slice(0, maxFiles));
        }
    };
    
    const handleCharacterFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files) {
             const newFiles = Array.from(e.dataTransfer.files);
             setCharacterImages(prev => [...prev, ...newFiles].slice(0, maxFiles));
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };


    const handleToggleSelection = (index: number) => {
        setSelectedIndices(prev => 
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleRemoveCharacter = (e: React.MouseEvent, indexToRemove: number) => {
        e.stopPropagation();
        setSelectedIndices(prev => prev.filter(i => i !== indexToRemove).map(i => i > indexToRemove ? i - 1 : i));
        setCharacterImages(prev => prev.filter((_, i) => i !== indexToRemove));
    };
    
    const isUploaderDisabled = characterImages.length >= maxFiles;

    return (
        <div className="space-y-8">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-users mr-2 text-indigo-400"></i>1. Tải lên ảnh nhân vật (tối đa {maxFiles}, ảnh chân dung rõ mặt)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {characterImages.map((file, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer" onClick={() => handleToggleSelection(index)}>
                            <img src={URL.createObjectURL(file)} alt={`Character ${index + 1}`} className="w-full h-full object-cover"/>
                            <div className={`absolute inset-0 transition-all duration-300 ${selectedIndices.includes(index) ? 'bg-indigo-700/60 border-4 border-indigo-400' : 'bg-black/50 group-hover:bg-black/20'}`}></div>
                            {selectedIndices.includes(index) && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                                    <i className="fa-solid fa-check text-sm"></i>
                                </div>
                            )}
                             <div className="absolute bottom-1 left-2 text-white font-bold text-lg" style={{textShadow: '1px 1px 3px black'}}>{index + 1}</div>
                            <button onClick={(e) => handleRemoveCharacter(e, index)} className="absolute top-2 left-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Xóa ảnh">
                                <i className="fa-solid fa-times text-sm"></i>
                            </button>
                        </div>
                    ))}
                    {!isUploaderDisabled && (
                        <div 
                            className="relative group aspect-square rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-all cursor-pointer"
                             onClick={() => document.getElementById('character-file-input')?.click()}
                             onDrop={handleCharacterFileDrop}
                             onDragOver={handleDragOver}
                        >
                            <i className="fa-solid fa-plus text-3xl"></i>
                            <span className="text-xs mt-1">Thêm ảnh</span>
                             <input 
                                type="file" 
                                id="character-file-input"
                                multiple
                                accept="image/*" 
                                className="hidden"
                                onChange={handleCharacterFileChange}
                            />
                        </div>
                    )}
                </div>
                 <p className="text-xs text-slate-500 mt-2">Nhấn vào ảnh để chọn hoặc bỏ chọn ghép.</p>
            </div>
            
            <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-mountain-sun mr-2 text-indigo-400"></i>2. Tải lên ảnh bối cảnh (tùy chọn)
                </label>
                <div className="max-w-md">
                    <BackgroundUploader imageFile={backgroundImage} setImageFile={setBackgroundImage} />
                </div>
            </div>

            <div>
                <label htmlFor="compositing-desc-input" className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-file-prescription mr-2 text-indigo-400"></i>3. Mô tả cảnh
                </label>
                <textarea 
                    id="compositing-desc-input" 
                    rows={4} 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    placeholder="Ví dụ: Nhân vật 1 và 2 đang ngồi trên ghế sofa trò chuyện vui vẻ. Nhân vật 3 đứng phía sau nhìn ra cửa sổ. Ánh nắng chiều chiếu vào phòng..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                ></textarea>
                 <p className="text-xs text-slate-500 mt-2">Mô tả càng chi tiết, AI sẽ ghép ảnh càng chính xác và tự nhiên.</p>
            </div>
        </div>
    );
};

export default CharacterCompositingTab;
