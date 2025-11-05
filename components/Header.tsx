import React, { useState, useEffect } from 'react';

interface HeaderProps {
    authType: 'owner' | 'guest' | 'user';
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ authType, onLogout }) => {
    const [currentDateTime, setCurrentDateTime] = useState(new Date());
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000); // Cập nhật mỗi giây

        // Dọn dẹp interval khi component bị unmount
        return () => {
            clearInterval(timer);
        };
    }, []); // Mảng phụ thuộc rỗng đảm bảo hiệu ứng chỉ chạy một lần khi mount

    const formattedTime = currentDateTime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const formattedDate = currentDateTime.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });

    const handleShare = () => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('mode', 'view');
        navigator.clipboard.writeText(currentUrl.toString()).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert('Không thể sao chép liên kết.');
        });
    };


    return (
        <header className="bg-slate-900/70 backdrop-blur-lg border-b border-slate-700/80 sticky top-0 z-10">
            <div className="w-full max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-3xl font-bold animated-gradient-text">Pidtap Studio</h1>
                        <p className="text-indigo-300">Phòng sáng tạo AI</p>
                    </div>
                     {authType === 'owner' && (
                        <button
                            onClick={handleShare}
                            className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <i className={`fa-solid ${isCopied ? 'fa-check' : 'fa-share-nodes'}`}></i>
                            <span className="hidden sm:inline">{isCopied ? 'Đã sao chép!' : 'Chia sẻ'}</span>
                        </button>
                    )}
                    {/* Hide "Change Key" button for the 'user' role */}
                    {(authType === 'owner' || authType === 'guest') && (
                        <button
                            onClick={onLogout}
                            title="Đăng xuất và đổi mã truy cập"
                            className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-red-600/80 transition-colors flex items-center gap-2"
                        >
                            <i className="fa-solid fa-right-from-bracket"></i>
                            <span className="hidden sm:inline">Đổi Key</span>
                        </button>
                    )}
                </div>
                <div className="text-right">
                    <p className="font-mono text-2xl text-white tracking-wider">{formattedTime}</p>
                    <p className="text-sm text-slate-400">{formattedDate}</p>
                </div>
            </div>
        </header>
    );
};

export default Header;