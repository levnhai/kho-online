/**
 * In-Memory API Cache System for High Performance Page Loading (SWR - Stale While Revalidate)
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // in milliseconds
}

class ApiCache {
  private cache = new Map<string, CacheEntry>();
  private defaultTtl: number = 3 * 60 * 1000; // 3 phút mặc định

  /**
   * Tạo cache key dựa trên URL và params
   */
  public generateKey(url: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return url;
    }
    const sortedKeys = Object.keys(params).sort();
    const query = sortedKeys
      .filter((k) => params[k] !== undefined && params[k] !== null)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(typeof params[k] === 'object' ? JSON.stringify(params[k]) : params[k])}`)
      .join('&');
    return `${url}?${query}`;
  }

  /**
   * Lấy dữ liệu từ cache nếu còn hạn
   */
  public get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Lưu dữ liệu vào cache
   */
  public set<T = any>(key: string, data: T, ttl = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Xóa một key cụ thể
   */
  public delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Xóa toàn bộ cache khớp với pattern (ví dụ: '/products', '/orders', '/categories')
   */
  public invalidate(prefixOrPattern: string | RegExp): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (typeof prefixOrPattern === 'string') {
        if (key.startsWith(prefixOrPattern) || key.includes(prefixOrPattern)) {
          this.cache.delete(key);
        }
      } else if (prefixOrPattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Xóa sạch toàn bộ cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Kiểm tra số lượng item trong cache
   */
  public size(): number {
    return this.cache.size;
  }
}

export const apiCache = new ApiCache();
