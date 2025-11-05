import React from 'react';
import TechOptionsSelector from './TechOptionsSelector';
import BranchSelector from './BranchSelector';
import { TechOptions, Branch, ImageAnalysisMode } from '../types';

interface IdeaTabProps {
    idea: string;
    setIdea: (idea: string) => void;
    techOptions: TechOptions;
    setTechOptions: (options: TechOptions) => void;
    selectedBranch: Branch;
    setSelectedBranch: (branch: Branch) => void;
    inputMode: 'idea' | 'direct';
    setInputMode: (mode: 'idea' | 'direct') => void;
    analysisMode: ImageAnalysisMode;
    setAnalysisMode: (mode: ImageAnalysisMode) => void;
    directPrompt: string;
    setDirectPrompt: (prompt: string) => void;
}

const IdeaTab: React.FC<IdeaTabProps> = ({ 
    idea, setIdea, 
    techOptions, setTechOptions, 
    selectedBranch, setSelectedBranch,
    inputMode, setInputMode,
    analysisMode, setAnalysisMode,
    directPrompt, setDirectPrompt
}) => {
    return (
        <div className="space-y-6">
            {/* Input Mode Switcher */}
            <div className="flex bg-slate-800/70 border border-slate-700 rounded-lg p-1 w-full max-w-sm">
                <button 
                    className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${inputMode === 'idea' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                    onClick={() => setInputMode('idea')}
                    aria-pressed={inputMode === 'idea'}
                >
                    <i className="fa-solid fa-lightbulb mr-2"></i> Từ Ý Tưởng
                </button>
                <button 
                    className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${inputMode === 'direct' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                    onClick={() => setInputMode('direct')}
                    aria-pressed={inputMode === 'direct'}
                >
                    <i className="fa-solid fa-terminal mr-2"></i> Prompt có sẵn
                </button>
            </div>

            {inputMode === 'idea' ? (
                // "From Idea" mode UI
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <label htmlFor="idea-input" className="block text-sm font-medium text-slate-300 mb-2">
                            Nhập ý tưởng chính của bạn:
                        </label>
                        <textarea 
                            id="idea-input" 
                            rows={3} 
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            placeholder="Ví dụ: một chiến binh rồng trong bộ giáp công nghệ cao, đứng trên đỉnh một..."
                            value={idea}
                            onChange={(e) => setIdea(e.target.value)}
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Chế độ sáng tạo:
                        </label>
                        <div className="flex bg-slate-800/70 border border-slate-700 rounded-lg p-1 w-full max-w-xs">
                            <button 
                                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${analysisMode === 'freestyle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                                onClick={() => setAnalysisMode('freestyle')}
                                aria-pressed={analysisMode === 'freestyle'}
                            >
                                <i className="fa-solid fa-brain mr-2"></i> Tự Do
                            </button>
                            <button 
                                className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${analysisMode === 'focused' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700/60'}`}
                                onClick={() => setAnalysisMode('focused')}
                                aria-pressed={analysisMode === 'focused'}
                            >
                                <i className="fa-solid fa-crosshairs mr-2"></i> Tập Trung
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            {analysisMode === 'freestyle' 
                                ? 'AI sẽ tự do sáng tạo từ ý tưởng của bạn, ít bị ràng buộc bởi cấu trúc.' 
                                : 'AI sẽ tuân thủ nghiêm ngặt cấu trúc chủ đề bạn chọn để có kết quả chính xác hơn.'}
                        </p>
                    </div>

                    {analysisMode === 'focused' && (
                        <BranchSelector 
                            selectedBranch={selectedBranch}
                            onSelectBranch={setSelectedBranch}
                        />
                    )}
                    
                    <TechOptionsSelector
                        techOptions={techOptions}
                        setTechOptions={setTechOptions}
                    />
                </div>
            ) : (
                // "Direct Prompt" mode UI
                <div className="animate-fade-in">
                    <label htmlFor="direct-prompt-input" className="block text-sm font-medium text-slate-300 mb-2">
                        Nhập prompt đầy đủ của bạn (ưu tiên Tiếng Anh):
                    </label>
                    <textarea 
                        id="direct-prompt-input" 
                        rows={8} 
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-mono"
                        placeholder="e.g., photorealistic, cinematic shot of a cyberpunk dragon warrior in high-tech armor, standing on a skyscraper, neon city lights, hyper-detailed, 8k --ar 16:9 --neg low quality, blurry"
                        value={directPrompt}
                        onChange={(e) => setDirectPrompt(e.target.value)}
                    ></textarea>
                     <p className="text-xs text-slate-500 mt-2">
                        Trong chế độ này, prompt của bạn sẽ được sử dụng trực tiếp để tạo ảnh. Các tùy chọn về chủ đề và kỹ thuật sẽ bị bỏ qua.
                    </p>
                </div>
            )}
        </div>
    );
};

export default IdeaTab;
