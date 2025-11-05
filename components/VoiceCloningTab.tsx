import React, { useState, useEffect } from 'react';

// A generic audio uploader component
const AudioUploader: React.FC<{ 
    id: string; 
    audioFile: File | null; 
    setAudioFile: (file: File | null) => void; 
}> = ({ id, audioFile, setAudioFile }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    useEffect(() => {
        if (audioFile) {
            const url = URL.createObjectURL(audioFile);
            setPreviewUrl(url);
            setFileName(audioFile.name);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
            setFileName(null);
        }
    }, [audioFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setAudioFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const resetAudio = (e: React.MouseEvent) => {
        e.stopPropagation();
        setAudioFile(null);
    };

    return (
        <div 
            className={`relative group w-full p-4 border-2 border-dashed border-slate-600 rounded-lg flex flex-col justify-center items-center text-slate-400 bg-slate-900/50 transition-all duration-300 hover:border-indigo-500 hover:text-indigo-400 cursor-pointer ${previewUrl ? 'border-indigo-500' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById(id)?.click()}
        >
            <input 
                type="file" 
                id={id} 
                accept="audio/*" 
                className="hidden"
                onChange={handleFileChange}
            />
            {previewUrl ? (
                <div className="text-center">
                    <p className="font-semibold text-white mb-2">File đã tải lên:</p>
                    <p className="text-sm text-indigo-300 font-mono break-all">{fileName}</p>
                    <audio src={previewUrl} controls className="mt-4 w-full" />
                     <button 
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 z-10" 
                        title="Xóa file" 
                        onClick={resetAudio}
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>
            ) : (
                <div className="text-center">
                    <i className="fa-solid fa-cloud-arrow-up text-4xl mb-2"></i>
                    <p>Nhấn để chọn hoặc kéo thả file âm thanh</p>
                    <p className="text-xs text-slate-500 mt-1">(.mp3, .wav, .ogg, v.v...)</p>
                </div>
            )}
        </div>
    );
};

interface VoiceCloningTabProps {
    sourceVoiceFile: File | null;
    setSourceVoiceFile: (file: File | null) => void;
    textToClone: string;
    setTextToClone: (text: string) => void;
}

const VoiceCloningTab: React.FC<VoiceCloningTabProps> = ({
    sourceVoiceFile,
    setSourceVoiceFile,
    textToClone,
    setTextToClone,
}) => {
    return (
        <div className="space-y-8">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-microphone mr-2 text-indigo-400"></i>
                    1. Tải lên file âm thanh chứa giọng nói mẫu:
                </label>
                <AudioUploader
                    id="source-voice-file-input"
                    audioFile={sourceVoiceFile}
                    setAudioFile={setSourceVoiceFile}
                />
                <p className="text-xs text-slate-500 mt-2">
                    Để có kết quả tốt nhất, hãy sử dụng một file âm thanh rõ ràng, không có tiếng ồn nền và có độ dài ít nhất 15-30 giây.
                </p>
            </div>
            <div>
                <label htmlFor="text-to-clone-input" className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-file-lines mr-2 text-indigo-400"></i>
                    2. Nhập văn bản bạn muốn tạo bằng giọng nói đã sao chép:
                </label>
                <textarea 
                    id="text-to-clone-input" 
                    rows={6} 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    placeholder="Nhập văn bản cần đọc ở đây..."
                    value={textToClone}
                    onChange={(e) => setTextToClone(e.target.value)}
                ></textarea>
            </div>
        </div>
    );
};

export default VoiceCloningTab;