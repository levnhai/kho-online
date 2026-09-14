import axios, { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { apiCache } from "@/shared/lib/apiCache";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipCache?: boolean;
    cacheTtl?: number;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {  
    "Content-Type": "application/json",
  },
});

const invalidateRelatedCache = (url: string = "") => {
  if (url.includes("/products")) {
    apiCache.invalidate("/products");
    apiCache.invalidate("/statistics");
  }
  if (url.includes("/categories")) {
    apiCache.invalidate("/categories");
    apiCache.invalidate("/products");
  }
  if (url.includes("/colors")) {
    apiCache.invalidate("/colors");
  }
  if (url.includes("/orders")) {
    apiCache.invalidate("/orders");
    apiCache.invalidate("/statistics");
  }
  if (url.includes("/imports")) {
    apiCache.invalidate("/imports");
    apiCache.invalidate("/statistics");
  }
  if (url.includes("/users") || url.includes("/auth")) {
    apiCache.invalidate("/users");
    apiCache.invalidate("/auth");
  }
  if (url.includes("/statistics")) {
    apiCache.invalidate("/statistics");
  }
};

// Caching Adapter cho Axios
const defaultAdapter = axios.getAdapter(
  api.defaults.adapter || ["xhr", "http"],
);

const cachingAdapter: AxiosAdapter = async (
  config: InternalAxiosRequestConfig,
) => {
  const method = (config.method || "get").toLowerCase();
  const isGet = method === "get";
  const skipCache = config.skipCache === true;
  const cacheKey = apiCache.generateKey(config.url || "", config.params);

  // 1. Nếu là GET và không skipCache -> kiểm tra Cache
  if (isGet && !skipCache) {
    const cachedData = apiCache.get(cacheKey);
    if (cachedData !== null) {
      return {
        data: cachedData,
        status: 200,
        statusText: "OK (From Cache)",
        headers: {},
        config,
        request: {},
      };
    }
  }

  // 2. Gửi request thực tế qua network adapter
  const response = await defaultAdapter(config);

  // 3. Nếu là GET thành công -> lưu vào Cache
  if (isGet && !skipCache && response.status >= 200 && response.status < 300) {
    apiCache.set(cacheKey, response.data, config.cacheTtl);
  }

  // 4. Nếu là POST, PUT, PATCH, DELETE -> tự động dọn dẹp cache liên quan
  if (
    ["post", "put", "patch", "delete"].includes(method) &&
    response.status >= 200 &&
    response.status < 300
  ) {
    invalidateRelatedCache(config.url);
  }

  return response;
};

api.defaults.adapter = cachingAdapter;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("kho_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("kho_token");
      apiCache.clear();
      const pathname = window.location.pathname;
      const isProtectedPage =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/checkout");
      if (
        isProtectedPage &&
        !pathname.startsWith("/login") &&
        !pathname.startsWith("/register")
      ) {
        window.location.href = `/login?notice=${encodeURIComponent("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")}`;
      }
    }
    const message =
      error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại";
    return Promise.reject(
      new Error(Array.isArray(message) ? message.join(", ") : message),
    );
  },
);

export default api;
