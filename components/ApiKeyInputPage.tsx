import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';

interface ApiKeyInputPageProps {
    onSetKey: (key: string) => void;
}

const ApiKeyInputPage: React.FC<ApiKeyInputPageProps> = ({ onSetKey }) => {
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleVerifyAndSetKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const key = apiKey.trim();

        if (!key) {
            setError('Vui lòng nhập Mã API.');
            setIsLoading(false);
            return;
        }

        // Check for non-ASCII characters which cause header errors.
        // This is likely what's happening if the user pastes an internal auth key.
        if (/[^\x00-\x7F]/.test(key)) {
             setError('Mã API chứa các ký tự không hợp lệ. Vui lòng chỉ sử dụng Mã API Google Gemini hợp lệ.');
             setIsLoading(false);
             return;
        }

        try {
            // Test the key with a simple, non-costly call
            const ai = new GoogleGenAI({ apiKey: key });
            await ai.models.generateContent({
                model: 'gemini-2.5-flash', // A common, available model
                contents: 'test',
                config: { thinkingConfig: { thinkingBudget: 0 } } // Make it fast
            });
            // If the call succeeds, the key is valid.
            onSetKey(key);
        } catch (err: any) {
            console.error("API Key validation failed:", err);
            let errorMessage = "Mã API không hợp lệ hoặc đã xảy ra lỗi mạng. Vui lòng kiểm tra lại mã của bạn và thử lại.";
            if (err.message?.includes('API key not valid')) {
                errorMessage = 'Mã API không hợp lệ. Vui lòng kiểm tra lại.';
            } else if (err.message?.includes('found for API key') || err.message?.includes('Requested entity was not found')) {
                errorMessage = 'Mã API không được liên kết với một dự án Google Cloud hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại cấu hình.';
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-slate-800/60 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-2xl shadow-black/30 border border-indigo-500/30 max-w-lg w-full">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold animated-gradient-text">Chào mừng đến Pidtap Studio</h1>
                    <p className="text-indigo-300 mt-1">
                        Vui lòng nhập Mã API Google Gemini của bạn để bắt đầu
                    </p>
                </div>
                
                <form onSubmit={handleVerifyAndSetKey} className="space-y-6">
                    <div>
                        <label htmlFor="api-key" className="sr-only">Google Gemini API Key</label>
                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fa-solid fa-key text-slate-400"></i>
                            </div>
                            <input
                                id="api-key"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Nhập Mã API của bạn ở đây..."
                                required
                                disabled={isLoading}
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition disabled:opacity-50"
                            />
                        </div>
                    </div>
                    
                    {error && (
                        <p className="text-red-400 text-sm animate-fade-in">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !apiKey}
                        className={`w-full px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 text-lg transform hover:-translate-y-0.5 ${isLoading ? 'gen-button-loading cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:shadow-indigo-500/40'} ${(isLoading || !apiKey) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                <span>Đang xác thực...</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-rocket"></i>
                                <span>Bắt đầu</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="text-left text-xs text-slate-400 mt-8 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <h4 className="font-bold text-slate-300 mb-2">Làm thế nào để lấy Mã API?</h4>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Google AI Studio</a> để tạo Mã API của bạn.</li>
                        <li>
                            <strong>Lưu ý quan trọng:</strong> Các tính năng nâng cao như <strong>Tạo Ảnh (Imagen)</strong> và <strong>Tạo Video (Veo)</strong> có thể yêu cầu Mã API của bạn phải được liên kết với một dự án Google Cloud có bật tính năng thanh toán.
                        </li>
                        <li>Nếu bạn gặp lỗi "entity not found" hoặc lỗi quyền truy cập, vui lòng đảm bảo dự án Google Cloud của bạn đã được cấu hình đúng cách.
                            <a href="https://cloud.google.com/billing/docs/how-to/create-billing-account" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline ml-1">Tìm hiểu thêm về thanh toán.</a>
                        </li>
                    </ol>
                </div>

                 <p className="text-xs text-slate-500 mt-4 text-center">
                    Mã API của bạn được lưu trữ an toàn trong trình duyệt và không được gửi đi bất cứ đâu ngoài các máy chủ của Google.
                 </p>
            </div>
        </div>
    );
};

export default ApiKeyInputPage;