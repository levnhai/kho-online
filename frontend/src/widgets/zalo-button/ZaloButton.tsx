import React from 'react';

export const ZaloButton: React.FC = () => {
  const phoneNumber = '0865854741';
  const displayPhone = '0865 854 741';
  const zaloUrl = `https://zalo.me/${phoneNumber}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Nút icon Zalo tròn chính */}
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-[#0068FF] text-white shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/60 transition-all duration-300 transform hover:scale-108 active:scale-95 cursor-pointer overflow-visible"
        title={`Chat Zalo: ${displayPhone}`}
        aria-label="Liên hệ Zalo"
      >
        {/* Hiệu ứng sóng lan toả (Ripple / Ping) */}
        <span className="absolute -inset-1 rounded-full bg-[#0068FF] opacity-40 animate-ping pointer-events-none" />
        <span className="absolute -inset-2 rounded-full bg-[#0068FF] opacity-20 animate-pulse pointer-events-none" />

        {/* Logo Zalo chuẩn chính thức */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
          alt="Zalo"
          className="w-10 h-10 object-contain relative z-10 drop-shadow-xs pointer-events-none"
        />

        {/* Chấm Online Indicator */}
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full z-20 shadow-2xs" />
      </a>
    </div>
  );
};

