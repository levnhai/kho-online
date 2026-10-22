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

// Bộ nhớ cache tạm trong phiên duyệt để tránh fetch lại nhiều lần
const dataUrlCache = new Map<string, string>();

/**
 * Helper bọc timeout cho Promise để ngăn treo giao diện khi mạng kém
 */
const withTimeout = <T>(promise: Promise<T>, ms = 3500): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout sau ${ms}ms`)), ms)
    ),
  ]);
};

/**
 * Tải và chuyển đổi một URL hình ảnh bất kỳ sang Base64 Data URL (data:image/...)
 * Giải quyết triệt để lỗi mất ảnh khi xuất PDF/Canvas trên Safari iOS (iPhone/iPad) và mobile:
 * - Không bị chặn bởi CORS
 * - Không bị Safari ITP (Intelligent Tracking Prevention) chặn
 * - Không bị html-to-image foreignObject bỏ qua ảnh remote
 */
export const loadImageAsDataUrl = async (
  url?: string,
  fallback = DEFAULT_PRODUCT_FALLBACK_IMAGE,
): Promise<string> => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  const trimmed = url.trim();

  // Đã là Base64 Data URL sẵn
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  const fullUrl = getImageUrl(trimmed, fallback);
  if (fullUrl.startsWith('data:image/')) {
    return fullUrl;
  }

  if (dataUrlCache.has(fullUrl)) {
    return dataUrlCache.get(fullUrl)!;
  }

  // 1. Phương pháp Fetch CORS -> Blob -> Base64 FileReader (kèm timeout 3.5s)
  try {
    const fetchBlob = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      try {
        const res = await fetch(fullUrl, { mode: 'cors', signal: controller.signal });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } finally {
        clearTimeout(timer);
      }
    };

    const base64 = await fetchBlob();
    if (base64 && base64.startsWith('data:image/')) {
      dataUrlCache.set(fullUrl, base64);
      return base64;
    }
  } catch (err) {
    // Fetch có thể fail nếu CORS chặn
  }

  // 2. Phương pháp Canvas drawImage qua new Image() với crossOrigin = "anonymous" (timeout 3.5s)
  try {
    const convertViaImage = new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 100;
          canvas.height = img.naturalHeight || 100;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context null'));
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = reject;
      img.src = fullUrl;
    });

    const base64 = await withTimeout(convertViaImage, 3500);
    if (base64 && base64.startsWith('data:image/')) {
      dataUrlCache.set(fullUrl, base64);
      return base64;
    }
  } catch (err) {
    // Canvas tainted hoặc load error
  }

  // 3. Phương pháp quét thẻ <img> đã render thành công trên trang Preview
  try {
    const existingImgs = Array.from(document.querySelectorAll('img'));
    const matchedImg = existingImgs.find(
      (img) => (img.currentSrc === fullUrl || img.src === fullUrl) && img.naturalWidth > 0
    );
    if (matchedImg) {
      const canvas = document.createElement('canvas');
      canvas.width = matchedImg.naturalWidth;
      canvas.height = matchedImg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(matchedImg, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.95);
        if (base64 && base64.startsWith('data:image/')) {
          dataUrlCache.set(fullUrl, base64);
          return base64;
        }
      }
    }
  } catch (err) {
    // Thẻ img tainted
  }

  // 4. Phương pháp qua Backend Proxy (nếu link ngoài từ domain khác bị chặn CORS)
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const proxyUrl = `${apiUrl}/upload/proxy-image?url=${encodeURIComponent(fullUrl)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(proxyUrl, { signal: controller.signal });
      if (res.ok) {
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (base64 && base64.startsWith('data:image/')) {
          dataUrlCache.set(fullUrl, base64);
          return base64;
        }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    // Proxy không khả dụng
  }

  // Fallback an toàn cuối cùng
  return fallback;
};
