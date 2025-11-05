import React, { useState } from 'react';
import Spinner from './Spinner';

// Result type from the cobalt API
interface DownloadResult {
    status: 'success' | 'redirect' | 'stream' | 'error' | 'picker';
    text?: string;
    url?: string;
    pickerType?: 'various' | 'images' | 'videos';
    picker?: {
        type?: 'video' | 'photo';
        label: string;
        url: string;
    }[];
    audio?: string;
}

const YouTubeDownloaderTab: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<DownloadResult | null>(null);
    const [currentRequest, setCurrentRequest] = useState<AbortController | null>(null);


    const handleFetchLinks = async (fetchUrl: string) => {
        if (!fetchUrl || (!fetchUrl.includes('youtube.com') && !fetchUrl.includes('youtu.be'))) {
            setError('Vui lòng nhập một link YouTube hợp lệ.');
            return;
        }
        
        // Abort previous request if it's still running
        if (currentRequest) {
            currentRequest.abort();
        }

        const controller = new AbortController();
        setCurrentRequest(controller);
        
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Using a public instance of Cobalt API, routed through a CORS proxy to prevent fetch errors.
            const apiUrl = 'https://co.wuk.sh/api/json';
            
            // Public CORS proxies are often unreliable. The previous one (fringe.zone) went down. Switching to a new one.
            const proxiedUrl = `https://corsproxy.io/?${apiUrl}`;

            const response = await fetch(proxiedUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    url: fetchUrl,
                    isAudioOnly: false,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API call failed with status: ${response.status}. ${errorText}`);
            }

            const data: DownloadResult = await response.json();

            if (data.status === 'error') {
                throw new Error(data.text || 'API trả về lỗi không xác định.');
            }

            setResult(data);

        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('Fetch aborted');
                return;
            }
            console.error('YouTube download error:', err);
            let errorMessage = `Không thể tải video. Lỗi: ${err.message}`;
            if (err.message.includes('Failed to fetch')) {
                errorMessage += ' Dịch vụ proxy CORS có thể đang gặp sự cố. Vui lòng thử lại sau.';
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setCurrentRequest(null);
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = e.clipboardData.getData('text');
        if (pastedText) {
            setUrl(pastedText);
            // Fetch immediately on paste
            handleFetchLinks(pastedText);
        }
    };
    
    const triggerFetch = () => {
        handleFetchLinks(url);
    }

    return (
        <div className="space-y-8">
            <div>
                <label htmlFor="youtube-download-url-input" className="block text-sm font-medium text-slate-300 mb-2">
                    <i className="fa-brands fa-youtube mr-2 text-red-500"></i>
                    Dán link video YouTube cần tải:
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="url"
                        id="youtube-download-url-input"
                        className="flex-grow bg-slate-900/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={url}
                        onChange={handleUrlChange}
                        onPaste={handlePaste}
                    />
                    <button
                        onClick={triggerFetch}
                        disabled={isLoading}
                        className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <i className="fa-solid fa-spinner fa-spin"></i>
                        ) : (
                            <i className="fa-solid fa-magnifying-glass"></i>
                        )}
                        <span>Tìm</span>
                    </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Dán link vào ô và nhấn Tìm, hoặc chỉ cần dán link để tự động tìm.</p>
            </div>
            {isLoading && (
                <div className="text-center">
                    <Spinner />
                    <p className="text-indigo-300 mt-2">Đang tìm link tải, vui lòng chờ...</p>
                </div>
            )}
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>}

            {result && (
                <div className="bg-slate-800/60 backdrop-blur-lg p-6 rounded-2xl border border-slate-700/80 animate-fade-in">
                    <h3 className="text-xl font-bold text-white mb-4">
                        <i className="fa-solid fa-circle-down mr-2"></i>
                        Kết quả
                    </h3>
                    <div className="space-y-3">
                        {result.text && <p className="text-slate-300 mb-4 font-semibold">{result.text}</p>}

                        {/* Direct link */}
                        {result.status === 'stream' && result.url && (
                            <a href={result.url} target="_blank" rel="noopener noreferrer" download className="block w-full text-center px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors">
                                Tải xuống Video
                            </a>
                        )}

                        {/* Picker for multiple formats */}
                        {result.status === 'picker' && result.picker && result.picker.length > 0 && (
                            result.picker.map((item, index) => (
                                <a key={index} href={item.url} target="_blank" rel="noopener noreferrer" download className="flex items-center justify-between px-4 py-3 bg-slate-700 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">
                                    <span className="font-semibold">{item.label || `Lựa chọn ${index + 1}`}</span>
                                    <i className="fa-solid fa-download"></i>
                                </a>
                            ))
                        )}

                        {/* Audio only link */}
                        {result.audio && (
                            <a href={result.audio} target="_blank" rel="noopener noreferrer" download className="flex items-center justify-between px-4 py-3 bg-slate-700 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">
                                <span className="font-semibold"><i className="fa-solid fa-music mr-2"></i> Tải Âm thanh (Audio)</span>
                                <i className="fa-solid fa-download"></i>
                            </a>
                        )}

                        {result.status !== 'picker' && !result.url && !result.audio && (
                            <p className="text-yellow-400">Không tìm thấy link tải trực tiếp. Vui lòng thử link khác.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default YouTubeDownloaderTab;