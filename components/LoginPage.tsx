import React, { useState } from 'react';

interface LoginPageProps {
    onLogin: (key: string) => boolean;
    onGoBack?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoBack }) => {
    const [accessKey, setAccessKey] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Simulate a small delay for better UX
        setTimeout(() => {
            const success = onLogin(accessKey);
            if (!success) {
                setError('Mã truy cập không hợp lệ. Vui lòng thử lại.');
                setAccessKey(''); // Clear the input on failure
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-slate-800/60 backdrop-blur-xl p-8 sm:p-10 rounded-2xl shadow-2xl shadow-black/30 border border-slate-700 max-w-md w-full text-center">
                <div className="mb-6">
                     <h1 className="text-3xl font-bold animated-gradient-text">Pidtap Studio</h1>
                    <p className="text-indigo-300 mt-1">
                        {onGoBack ? 'Đổi mã truy cập' : 'Yêu cầu quyền truy cập'}
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="access-key" className="sr-only">Mã Truy Cập</label>
                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fa-solid fa-key text-slate-400"></i>
                            </div>
                            <input
                                id="access-key"
                                type="password"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                placeholder={onGoBack ? "Nhập mã truy cập mới..." : "Nhập mã truy cập..."}
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
                        disabled={isLoading || !accessKey}
                        className={`w-full px-8 py-3 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 text-lg transform hover:-translate-y-0.5 ${isLoading ? 'gen-button-loading cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 hover:shadow-indigo-500/40'} ${(isLoading || !accessKey) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                <span>Đang kiểm tra...</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-lock-open"></i>
                                <span>{onGoBack ? 'Xác nhận đổi' : 'Mở khóa'}</span>
                            </>
                        )}
                    </button>
                </form>

                {onGoBack && (
                    <>
                        <div className="mt-6 flex items-center text-sm text-slate-500">
                            <div className="flex-grow border-t border-slate-700"></div>
                            <span className="flex-shrink px-4">Hoặc</span>
                            <div className="flex-grow border-t border-slate-700"></div>
                        </div>

                        <div className="mt-4">
                            <button 
                                onClick={onGoBack} 
                                className="w-full block text-center px-5 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <i className="fa-solid fa-arrow-left"></i> Quay lại
                            </button>
                        </div>
                    </>
                )}

                 <p className="text-xs text-slate-500 mt-8">
                    Bạn cần có mã truy cập hợp lệ để sử dụng ứng dụng này. Vui lòng liên hệ quản trị viên để nhận mã.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;