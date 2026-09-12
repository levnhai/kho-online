/**
 * Helper chuẩn hoá đường dẫn URL hình ảnh
 * Hỗ trợ cả ảnh nội bộ (/uploads/...) và ảnh bên ngoài (https://...)
 */
export const getImageUrl = (url?: string, fallback = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'): string => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  const trimmed = url.trim();

  // Nếu là đường dẫn tĩnh /uploads/...
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
    return trimmed;
  }

  return trimmed;
};
