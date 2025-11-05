import React from 'react';
import { CreativityLevel } from '../types';

interface StoryCloningTabProps {
    originalStory: string;
    setOriginalStory: (story: string) => void;
    creativityLevel: CreativityLevel;
    setCreativityLevel: (level: CreativityLevel) => void;
    storyTwists: string;
    setStoryTwists: (twists: string) => void;
    storyCharacterCount: string;
    setStoryCharacterCount: (count: string) => void;
}

const creativityOptions: { id: CreativityLevel; label: string; description: string; icon: string }[] = [
    { id: 'faithful', label: 'Bám sát Gốc', description: 'Giữ nguyên cốt truyện, chỉ thay đổi chi tiết.', icon: 'fa-solid fa-anchor' },
    { id: 'balanced', label: 'Cân bằng', description: 'Giữ nhân vật & chủ đề, thay đổi cốt truyện.', icon: 'fa-solid fa-scale-balanced' },
    { id: 'creative', label: 'Sáng tạo Tự do', description: 'Chỉ dùng làm cảm hứng, tạo ra câu chuyện mới hoàn toàn.', icon: 'fa-solid fa-rocket' },
];

const StoryCloningTab: React.FC<StoryCloningTabProps> = ({
    originalStory,
    setOriginalStory,
    creativityLevel,
    setCreativityLevel,
    storyTwists,
    setStoryTwists,
    storyCharacterCount,
    setStoryCharacterCount,
}) => {
    return (
        <div className="space-y-8">
            <div>
                <label htmlFor="original-story-input" className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-book-open mr-2 text-indigo-400"></i>
                    1. Dán câu chuyện gốc của bạn vào đây:
                </label>
                <textarea
                    id="original-story-input"
                    rows={12}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    placeholder="Dán toàn bộ nội dung câu chuyện, tiểu thuyết, hoặc kịch bản bạn muốn AI sử dụng làm nền tảng..."
                    value={originalStory}
                    onChange={(e) => setOriginalStory(e.target.value)}
                ></textarea>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-700">
                <h3 className="text-base font-semibold text-slate-200">
                    <i className="fa-solid fa-gears mr-2 text-indigo-400"></i>2. Chọn cách AI biến đổi câu chuyện:
                </h3>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Mức độ Sáng tạo:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {creativityOptions.map((option) => (
                             <label
                                key={option.id}
                                className={`flex flex-col text-center p-4 rounded-lg border-2 transition-all cursor-pointer ${creativityLevel === option.id ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                            >
                                <input
                                    type="radio"
                                    name="creativity-level"
                                    value={option.id}
                                    checked={creativityLevel === option.id}
                                    onChange={() => setCreativityLevel(option.id)}
                                    className="sr-only"
                                />
                                <i className={`${option.icon} text-2xl mb-2 ${creativityLevel === option.id ? 'text-indigo-400' : 'text-slate-400'}`}></i>
                                <span className="font-semibold text-white">{option.label}</span>
                                <p className="text-xs text-slate-400 mt-1">{option.description}</p>
                            </label>
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="story-twists-input" className="block text-sm font-medium text-slate-300 mb-2">
                            Cảm xúc & Tình tiết bất ngờ (tùy chọn):
                        </label>
                        <input
                            type="text"
                            id="story-twists-input"
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            placeholder="Ví dụ: kết thúc bi thảm, nhân vật chính phản diện..."
                            value={storyTwists}
                            onChange={(e) => setStoryTwists(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="character-count-input" className="block text-sm font-medium text-slate-300 mb-2">
                            Số lượng nhân vật (tùy chọn):
                        </label>
                        <input
                            type="number"
                            id="character-count-input"
                            min="1"
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            placeholder="Ví dụ: 3"
                            value={storyCharacterCount}
                            onChange={(e) => setStoryCharacterCount(e.target.value)}
                        />
                    </div>
                </div>
                <p className="text-xs text-slate-500">Để trống các trường tùy chọn để AI tự quyết định dựa trên mức độ sáng tạo bạn đã chọn.</p>
            </div>
        </div>
    );
};

export default StoryCloningTab;
