import React from 'react';
import { HistoryItem } from '../types';

interface HistoryTabProps {
    history: HistoryItem[];
    onReload: (item: HistoryItem) => void;
    onDelete: (id: number) => void;
    onClear: () => void;
}

const getTabTranslation = (tabId: HistoryItem['tab']) => {
    // FIX: Removed the 'history' key as it's not a valid generative tab
    // and would cause a type error once HistoryItem['tab'] is correctly typed as Tab.
    // FIX: Add missing 'tts' property to the tab translations object to satisfy the type requirement for all possible Tab values.
    const translations: { [key in HistoryItem['tab']]: string } = {
        'ai_gen': 'Chỉnh sửa AI (AI Gen)',
        'create_image': 'Tạo Ảnh',
        'process_old_image': 'Xử lý Ảnh cũ',
        'character_compositing': 'Ghép Ảnh',
        'video': 'Tạo Video',
        'video_storyboard': 'Kịch bản Video',
        'youtube_tools': 'Công cụ YouTube',
        'tts': 'Voice AI (TTS)',
        // FIX: Add missing 'voice_cloning' property to satisfy the type requirement.
        'voice_cloning': 'Sao chép Giọng nói',
        'story_cloning': 'Clone Truyện',
        'youtube_script': 'Kịch bản YouTube',
    };
    return translations[tabId] || 'Hoạt động';
};


const HistoryTab: React.FC<HistoryTabProps> = ({ history, onReload, onDelete, onClear }) => {

    if (history.length === 0) {
        return (
            <div className="text-center py-12">
                <i className="fa-solid fa-folder-open text-5xl text-slate-600 mb-4"></i>
                <h3 className="text-xl font-bold text-white">Lịch sử trống</h3>
                <p className="text-slate-400 mt-2">Chưa có hoạt động nào được ghi lại. Hãy bắt đầu sáng tạo!</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Lịch sử Hoạt động</h2>
                <button 
                    onClick={onClear}
                    className="px-4 py-2 bg-red-600/20 text-red-300 font-semibold rounded-lg hover:bg-red-600/50 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                   <i className="fa-solid fa-trash-can"></i> Xóa tất cả
                </button>
            </div>

            <div className="space-y-4">
                {history.map(item => (
                    <div key={item.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex flex-col sm:flex-row gap-4 items-start animate-fade-in">
                        {/* Preview */}
                        <div className="w-full sm:w-32 h-32 sm:h-24 flex-shrink-0 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                             {item.preview.type === 'image' && <img src={`data:image/png;base64,${item.preview.data}`} alt="Preview" className="w-full h-full object-cover" />}
                             {item.preview.type === 'video' && <video src={item.preview.data} className="w-full h-full object-cover" muted loop playsInline />}
                             {(item.preview.type === 'text' || item.preview.type === 'storyboard') && (
                                <div className="p-2 text-center">
                                    <i className={`fa-solid ${item.preview.type === 'storyboard' ? 'fa-clapperboard' : 'fa-file-alt'} text-3xl text-indigo-400 mb-2`}></i>
                                    <p className="text-xs text-slate-300 line-clamp-3">{item.preview.data}</p>
                                </div>
                             )}
                        </div>

                        {/* Info & Actions */}
                        <div className="flex-grow">
                             <p className="text-sm font-semibold text-indigo-400">{getTabTranslation(item.tab)}</p>
                             <p className="text-xs text-slate-500 mb-3">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                             <div className="flex items-center gap-3">
                                 <button
                                    onClick={() => onReload(item)}
                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors text-sm flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-repeat"></i> Tải lại
                                </button>
                                 <button
                                    onClick={() => onDelete(item.id)}
                                    className="px-4 py-2 bg-slate-700 text-slate-300 font-semibold rounded-lg hover:bg-red-600/50 hover:text-white transition-colors text-sm flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-trash"></i> Xóa
                                </button>
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryTab;