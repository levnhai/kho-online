import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Sparkles } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra nếu app đã được mở ở chế độ PWA Standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return; // Không hiển thị nếu người dùng đã cài đặt và đang mở app
    }

    // 2. Kiểm tra nếu người dùng đã từng bấm "Để sau" trong vòng 24 giờ
    const dismissedAt = localStorage.getItem('kho_pwa_dismissed');
    if (dismissedAt) {
      const hoursPassed = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
      if (hoursPassed < 24) {
        return;
      }
    }

    // 3. Bắt sự kiện beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Phát hiện thiết bị iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edge|opr/.test(ua);

    if (isIosDevice && isSafari && !isStandalone) {
      setIsIos(true);
      // Hiển thị banner cho iOS sau 3 giây
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('kho_pwa_dismissed', Date.now().toString());
    setShowPrompt(false);
    setShowIosGuide(false);
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Banner cài đặt nổi ở góc dưới màn hình */}
      <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up">
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl p-4 border border-blue-100 dark:border-slate-700 shadow-2xl shadow-blue-900/20 text-gray-900 dark:text-white flex items-center gap-3.5 relative overflow-hidden">
          {/* Decorative Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          {/* Icon App */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 flex-shrink-0">
            <Smartphone size={24} className="animate-pulse" />
          </div>

          {/* Nội dung */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white tracking-tight">
                Cài đặt ứng dụng KHO
              </h4>
              <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-[9px] rounded-full flex items-center gap-0.5">
                <Sparkles size={8} /> App
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
              Mở nhanh từ màn hình chính, trải nghiệm mượt mà!
            </p>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-xs shadow-blue-500/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>{isIos ? 'Cách cài đặt' : 'Cài đặt ngay'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                Để sau
              </button>
            </div>
          </div>

          {/* Nút đóng */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-2.5 right-2.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Modal Hướng dẫn cài đặt cho iOS Safari */}
      {showIosGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-gray-100 dark:border-slate-700 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <Smartphone size={28} />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Cài đặt KHO Online trên iPhone / iPad
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Thực hiện 2 bước đơn giản để thêm ứng dụng vào màn hình chính:
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-900/60 rounded-2xl p-3.5 text-left space-y-3 border border-gray-100 dark:border-slate-700/80 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  1
                </div>
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <span>Nhấn vào nút</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                    <Share size={13} /> Chia sẻ
                  </span>
                  <span>ở thanh dưới Safari</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                  2
                </div>
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                  <span>Chọn mục</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
                    <PlusSquare size={13} /> Thêm vào MH chính
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md shadow-blue-500/25 cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
