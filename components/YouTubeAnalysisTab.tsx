import React from 'react';
import { YouTubeAnalysisType } from '../types';

interface YouTubeAnalysisTabProps {
    channelUrl: string;
    setChannelUrl: (url: string) => void;
    analysisType: YouTubeAnalysisType;
    setAnalysisType: (type: YouTubeAnalysisType) => void;
}

const analysisOptions: { id: YouTubeAnalysisType; label: string; description: string; icon: string }[] = [
    { 
        id: 'swot', 
        label: 'Phân tích SWOT', 
        description: 'Điểm mạnh, Điểm yếu, Cơ hội & Thách thức.',
        icon: 'fa-solid fa-chess-board'
    },
    { 
        id: 'content_strategy', 
        label: 'Chiến lược Nội dung', 
        description: 'Chủ đề, định dạng, phong cách và đối tượng mục tiêu.',
        icon: 'fa-solid fa-lightbulb'
    },
    { 
        id: 'audience_engagement', 
        label: 'Tương tác Khán giả', 
        description: 'Phân tích bình luận, tình cảm và chủ đề thảo luận.',
        icon: 'fa-solid fa-users'
    },
    { 
        id: 'growth_opportunities', 
        label: 'Cơ hội Tăng trưởng', 
        description: 'Gợi ý ý tưởng video mới, hướng phát triển tiềm năng.',
        icon: 'fa-solid fa-arrow-trend-up'
    },
];

const YouTubeAnalysisTab: React.FC<YouTubeAnalysisTabProps> = ({
    channelUrl,
    setChannelUrl,
    analysisType,
    setAnalysisType,
}) => {
    return (
        <div className="space-y-8">
            <div>
                <label htmlFor="youtube-url-input" className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-brands fa-youtube mr-2 text-red-500"></i>
                    Dán link kênh YouTube cần phân tích:
                </label>
                <input
                    type="url"
                    id="youtube-url-input"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    placeholder="https://www.youtube.com/channel/..."
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                />
            </div>

            <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-gears mr-2 text-indigo-400"></i>
                    Chọn loại phân tích:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analysisOptions.map((option) => (
                        <label
                            key={option.id}
                            className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${analysisType === option.id ? 'bg-indigo-900/50 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                        >
                            <input
                                type="radio"
                                name="analysis-type"
                                value={option.id}
                                checked={analysisType === option.id}
                                onChange={() => setAnalysisType(option.id)}
                                className="mt-1 mr-4 h-4 w-4 shrink-0 text-indigo-600 bg-slate-700 border-slate-600 focus:ring-indigo-500"
                            />
                            <div>
                                <div className="flex items-center gap-2 font-semibold text-white">
                                    <i className={option.icon}></i>
                                    <span>{option.label}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{option.description}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default YouTubeAnalysisTab;
