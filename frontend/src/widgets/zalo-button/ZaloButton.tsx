import React, { useState, useRef, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'zalo_button_position';

export const ZaloButton: React.FC = () => {
  const phoneNumber = '0865854741';
  const displayPhone = '0865 854 741';
  const zaloUrl = `https://zalo.me/${phoneNumber}`;

  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  const buttonRef = useRef<HTMLDivElement>(null);

  // Tính vị trí mặc định nếu chưa có (cách đáy 80px, cách phải 24px)
  useEffect(() => {
    if (!position) {
      const defaultX = Math.max(16, window.innerWidth - 56 - 24);
      const defaultY = Math.max(16, window.innerHeight - 56 - 80);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position]);

  // Điều chỉnh vị trí khi resize màn hình để không bị lọt ra ngoài
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const buttonSize = 56;
        const maxX = Math.max(16, window.innerWidth - buttonSize - 16);
        const maxY = Math.max(16, window.innerHeight - buttonSize - 16);
        const clampedX = Math.min(Math.max(16, prev.x), maxX);
        const clampedY = Math.min(Math.max(16, prev.y), maxY);
        return { x: clampedX, y: clampedY };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Chỉ xử lý chuột trái hoặc chạm cảm ứng
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const el = buttonRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
      hasMoved: false,
    };

    setIsDragging(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - dragInfoRef.current.startX;
      const dy = moveEvent.clientY - dragInfoRef.current.startY;

      if (!dragInfoRef.current.hasMoved && Math.hypot(dx, dy) > 4) {
        dragInfoRef.current.hasMoved = true;
      }

      if (dragInfoRef.current.hasMoved) {
        const buttonSize = 56;
        const maxX = window.innerWidth - buttonSize - 12;
        const maxY = window.innerHeight - buttonSize - 12;

        const nextX = Math.min(Math.max(12, dragInfoRef.current.initialX + dx), maxX);
        const nextY = Math.min(Math.max(12, dragInfoRef.current.initialY + dy), maxY);

        setPosition({ x: nextX, y: nextY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      setIsDragging(false);

      if (dragInfoRef.current.hasMoved) {
        // Lưu vị trí mới vào localStorage
        const el = buttonRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const finalPos = { x: rect.left, y: rect.top };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalPos));
          } catch {
            // Ignore storage errors
          }
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    // Nếu vừa kéo di chuyển thì chặn mở link Zalo
    if (dragInfoRef.current.hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  return (
    <div
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        bottom: position ? 'auto' : '80px',
        right: position ? 'auto' : '24px',
        touchAction: 'none',
      }}
      className={`z-50 select-none ${
        isDragging ? 'cursor-grabbing scale-105 transition-none' : 'cursor-grab transition-transform duration-200'
      }`}
    >
      {/* Nút icon Zalo tròn chính */}
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        draggable={false}
        className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-[#0068FF] text-white shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/60 active:scale-95 overflow-visible select-none"
        title={`Nhấn để chat Zalo (${displayPhone}) • Nhấn giữ để di chuyển`}
        aria-label="Liên hệ Zalo"
      >
        {/* Hiệu ứng sóng lan toả (Ripple / Ping) */}
        {!isDragging && (
          <>
            <span className="absolute -inset-1 rounded-full bg-[#0068FF] opacity-40 animate-ping pointer-events-none" />
            <span className="absolute -inset-2 rounded-full bg-[#0068FF] opacity-20 animate-pulse pointer-events-none" />
          </>
        )}

        {/* Logo Zalo chuẩn chính thức */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
          alt="Zalo"
          draggable={false}
          className="w-10 h-10 object-contain relative z-10 drop-shadow-xs pointer-events-none select-none"
        />

        {/* Chấm Online Indicator */}
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full z-20 shadow-2xs pointer-events-none" />
      </a>
    </div>
  );
};

