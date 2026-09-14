import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Move,
} from 'lucide-react';
import { handleImageError, DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/shared/lib/imageHelper';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images: rawImages,
  productName,
}) => {
  // Đảm bảo luôn có ít nhất 1 ảnh hợp lệ
  const safeImages = (rawImages && rawImages.length > 0)
    ? rawImages
    : [DEFAULT_PRODUCT_FALLBACK_IMAGE];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeImage = safeImages[activeIndex] || safeImages[0];

  // Đảm bảo activeIndex hợp lệ khi danh sách ảnh thay đổi
  useEffect(() => {
    if (activeIndex >= safeImages.length) {
      setActiveIndex(0);
    }
  }, [safeImages.length, activeIndex]);

  // Đặt lại zoom & pan khi đổi ảnh hoặc đóng lightbox
  const resetZoomAndPan = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleOpenLightbox = (index?: number) => {
    if (typeof index === 'number') {
      setActiveIndex(index);
    }
    resetZoomAndPan();
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    resetZoomAndPan();
  };

  const handlePrevImage = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
    resetZoomAndPan();
  }, [safeImages.length, resetZoomAndPan]);

  const handleNextImage = useCallback(() => {
    setActiveIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
    resetZoomAndPan();
  }, [safeImages.length, resetZoomAndPan]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleToggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomLevel > 1) {
      resetZoomAndPan();
    } else {
      setZoomLevel(2);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Khóa cuộn trang khi mở modal phóng to
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen, handlePrevImage, handleNextImage]);

  // Wheel zoom in modal
  const handleWheel = (e: React.WheelEvent) => {
    if (!isLightboxOpen) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(prev + 0.25, 3.5));
    } else {
      setZoomLevel((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-3 select-none">
      {/* Khung ảnh chính */}
      <div
        className="group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-50 dark:bg-slate-900/60 border border-gray-200/80 dark:border-slate-700/80 shadow-sm cursor-zoom-in transition-colors"
        onClick={() => handleOpenLightbox()}
        title="Nhấp để phóng to toàn màn hình"
      >
        <img
          src={activeImage}
          alt={productName}
          onError={handleImageError}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Số thứ tự ảnh */}
        {safeImages.length > 1 && (
          <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white font-medium text-[11px] sm:text-xs px-2.5 py-1 rounded-full z-10">
            {activeIndex + 1} / {safeImages.length}
          </span>
        )}

        {/* Nút phóng to nổi góc phải trên */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenLightbox();
          }}
          className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 hover:bg-black/70 backdrop-blur-md text-white opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95"
          title="Phóng to để xem"
        >
          <Maximize2 size={16} />
          <span className="hidden sm:inline text-[11px]">Phóng to</span>
        </button>

        {/* Nút lùi/tiến ảnh nhanh trên ảnh chính (nếu có nhiều ảnh) */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md active:scale-90 z-10"
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-gray-800 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md active:scale-90 z-10"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Gợi ý phóng to ở giữa khi hover desktop */}
        <div className="hidden sm:flex absolute inset-0 items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/60 backdrop-blur-md text-white text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <ZoomIn size={14} />
            <span>Nhấp để phóng to ảnh</span>
          </div>
        </div>
      </div>

      {/* Dải Thumbnails bên dưới */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-gray-50 dark:bg-slate-900 ${
                activeIndex === idx
                  ? 'border-blue-600 ring-4 ring-blue-500/20 dark:ring-blue-500/30 scale-100 opacity-100 shadow-sm'
                  : 'border-gray-200 dark:border-slate-700 opacity-60 hover:opacity-100 hover:border-gray-400 dark:hover:border-slate-500'
              }`}
              title={`Xem ảnh ${idx + 1}`}
            >
              <img
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                onError={handleImageError}
                className="w-full h-full object-cover"
              />
              {activeIndex === idx && (
                <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* MODAL LIGHTBOX PHÓNG TO TOÀN MÀN HÌNH */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col text-white animate-fade-in"
          onWheel={handleWheel}
        >
          {/* Header Lightbox */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-md text-gray-200">
                {productName}
              </span>
              <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full text-gray-300 font-mono flex-shrink-0">
                {activeIndex + 1} / {safeImages.length}
              </span>
            </div>

            {/* Các công cụ zoom và đóng */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="hidden sm:flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="p-1.5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                  title="Thu nhỏ (-)"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono px-2 min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3.5}
                  className="p-1.5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors"
                  title="Phóng to (+)"
                >
                  <ZoomIn size={16} />
                </button>
              </div>

              {zoomLevel > 1 && (
                <button
                  onClick={resetZoomAndPan}
                  className="p-2 sm:px-3 sm:py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-1.5 transition-colors"
                  title="Khôi phục kích thước 100%"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">100%</span>
                </button>
              )}

              <button
                onClick={handleCloseLightbox}
                className="p-2 bg-white/10 hover:bg-rose-600 rounded-xl text-white transition-colors ml-1 active:scale-95"
                title="Đóng (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Vùng xem ảnh phóng to */}
          <div
            className={`flex-1 relative overflow-hidden flex items-center justify-center p-4 ${
              zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
            }`}
            onClick={handleToggleZoom}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Ảnh lớn */}
            <img
              src={activeImage}
              alt={`${productName} full`}
              onError={handleImageError}
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              draggable={false}
              className="max-h-[75vh] max-w-[90vw] object-contain select-none shadow-2xl rounded-lg"
            />

            {/* Nút chuyển ảnh trước */}
            {safeImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-blue-600 backdrop-blur-md text-white transition-all shadow-xl active:scale-90 border border-white/10 z-20"
                title="Ảnh trước (←)"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Nút chuyển ảnh sau */}
            {safeImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-blue-600 backdrop-blur-md text-white transition-all shadow-xl active:scale-90 border border-white/10 z-20"
                title="Ảnh tiếp theo (→)"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Footer Lightbox: Thumbnails & Keyboard hints */}
          <div className="px-4 py-3 border-t border-white/10 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Dải thumbnail trong Lightbox */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              {safeImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveIndex(idx);
                    resetZoomAndPan();
                  }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeIndex === idx
                      ? 'border-blue-500 ring-2 ring-blue-400 scale-105 opacity-100'
                      : 'border-transparent opacity-40 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Hướng dẫn phím tắt */}
            <div className="text-[11px] text-gray-400 hidden sm:flex items-center gap-4">
              <span>Phím <kbd className="px-1.5 py-0.5 bg-white/10 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded">→</kbd> đổi ảnh</span>
              <span>Cuộn chuột hoặc nhấp đúp để zoom</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Esc</kbd> đóng</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
