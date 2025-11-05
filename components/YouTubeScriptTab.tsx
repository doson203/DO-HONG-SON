import React from 'react';

interface YouTubeScriptTabProps {
    topic: string;
    setTopic: (topic: string) => void;
}

const YouTubeScriptTab: React.FC<YouTubeScriptTabProps> = ({ topic, setTopic }) => {
    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="yt-script-topic-input" className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-solid fa-lightbulb mr-2 text-indigo-400"></i>
                    Nhập chủ đề chính cho câu chuyện của bạn:
                </label>
                <textarea 
                    id="yt-script-topic-input" 
                    rows={8} 
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    placeholder="Ví dụ: Nỗi oan của nàng dâu bị mẹ chồng ghét bỏ vì một lời nói đùa của hàng xóm."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                ></textarea>
                 <p className="text-xs text-slate-500 mt-2">
                    AI sẽ sử dụng chủ đề này để viết một câu chuyện dài 7 phần theo phong cách "Tâm Sự Cùng Vân Sâm", kèm theo tiêu đề, hook, mô tả và caption cho thumbnail.
                </p>
            </div>
        </div>
    );
};

export default YouTubeScriptTab;