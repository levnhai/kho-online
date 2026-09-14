/**
 * Ảnh placeholder trung tính dùng khi sản phẩm chưa có ảnh
 */
export const DEFAULT_PRODUCT_FALLBACK_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23f1f5f9"><rect width="400" height="400" fill="%23f8fafc"/><path d="M160 170a20 20 0 1 0 0-40 20 20 0 0 0 0 40zm-40 90h160l-50-65-35 45-25-30-50 50z" fill="%23cbd5e1"/><text x="50%" y="78%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" fill="%2394a3b8">Chưa có ảnh</text></svg>`;

/**
 * Helper chuẩn hoá đường dẫn URL hình ảnh
 * Hỗ trợ Cloudinary (https://res.cloudinary.com/...), ảnh ngoài (http/https), và ảnh cục bộ (/uploads/...)
 */
export const getImageUrl = (
  url?: string,
  fallback = DEFAULT_PRODUCT_FALLBACK_IMAGE,
): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  const trimmed = url.trim();

  // 1. Nếu là đường dẫn đầy đủ http:// hoặc https:// (Cloudinary, ImgBB, S3...)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // 2. Nếu là đường dẫn tĩnh /uploads/... từ Backend
  if (trimmed.startsWith('/uploads/')) {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
      try {
        const origin = new URL(apiUrl).origin;
        return `${origin}${trimmed}`;
      } catch (e) {
        return trimmed;
      }
    }
    // Khi chạy local dev, trỏ trực tiếp sang backend port 5000
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:5000${trimmed}`;
      }
    }
    return trimmed;
  }

  return trimmed;
};

/**
 * Event handler khi thẻ <img> bị lỗi tải ảnh (404, network error)
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback = DEFAULT_PRODUCT_FALLBACK_IMAGE,
) => {
  const target = e.currentTarget;
  if (target.src !== fallback) {
    target.onerror = null; // Ngăn loop vô tận
    target.src = fallback;
  }
};
