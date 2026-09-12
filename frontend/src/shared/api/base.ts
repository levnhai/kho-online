import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kho_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kho_token');
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = `/login?notice=${encodeURIComponent('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')}`;
      }
    }
    const message = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  }
);

export default api;
