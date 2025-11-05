import React from 'react';

const ViewOnlyBanner: React.FC = () => {
    return (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-lg text-center mb-6 animate-fade-in">
            <i className="fa-solid fa-eye mr-2"></i>
            <strong>Chế độ chỉ xem:</strong> Bạn đang xem một phiên bản được chia sẻ. Các chức năng chỉnh sửa và tạo mới đã được vô hiệu hóa.
        </div>
    );
};

export default ViewOnlyBanner;