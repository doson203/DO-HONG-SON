import React from 'react';
import { Tab } from '../types';

interface TabsProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
    const tabs: { id: Tab; icon: string; label: string }[] = [
        { id: 'ai_gen', icon: 'fa-solid fa-wand-magic-sparkles', label: 'AI Gen' },
        { id: 'create_image', icon: 'fa-solid fa-palette', label: 'Tạo Ảnh' },
        { id: 'process_old_image', icon: 'fa-solid fa-wand-magic', label: 'Xử lý ảnh cũ' },
        { id: 'character_compositing', icon: 'fa-solid fa-users-viewfinder', label: 'Ghép ảnh' },
        { id: 'video', icon: 'fa-solid fa-film', label: 'VEO 3 Video' },
        { id: 'video_storyboard', icon: 'fa-solid fa-clapperboard', label: 'Kịch bản Video' },
        { id: 'youtube_script', icon: 'fa-brands fa-youtube', label: 'Kịch bản YouTube' },
        { id: 'story_cloning', icon: 'fa-solid fa-book-sparkles', label: 'Clone Truyện' },
        { id: 'tts', icon: 'fa-solid fa-comment-dots', label: 'Voice AI (TTS)' },
        { id: 'voice_cloning', icon: 'fa-solid fa-user-astronaut', label: 'Sao chép Giọng nói' },
        { id: 'youtube_tools', icon: 'fa-solid fa-screwdriver-wrench', label: 'Công cụ YouTube' },
    ];

    return (
        <div className="flex justify-center mb-6">
             <div className="flex space-x-1 sm:space-x-2 p-1.5 bg-slate-800/70 rounded-full overflow-x-auto">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-semibold text-sm rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                                isActive 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                : 'text-slate-300 hover:bg-slate-700/50'
                            }`}
                            onClick={() => onTabChange(tab.id)}
                            aria-pressed={isActive}
                        >
                            <i className={tab.icon}></i>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Tabs;