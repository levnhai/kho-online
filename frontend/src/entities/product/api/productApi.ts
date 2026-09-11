import api from '@/shared/api/base';
import { Product } from '@/shared/types';

export interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const productApi = {
  getAll: (params?: any): Promise<ProductsResponse> => {
    return api.get('/products', { params });
  },
  getFeatured: (limit = 8): Promise<Product[]> => {
    return api.get('/products/featured', { params: { limit } });
  },
  getBestSellers: (limit = 8): Promise<Product[]> => {
    return api.get('/products/best-sellers', { params: { limit } });
  },
  getNewArrivals: (limit = 8): Promise<Product[]> => {
    return api.get('/products/new-arrivals', { params: { limit } });
  },
  getById: (id: string): Promise<Product> => {
    return api.get(`/products/${id}`);
  },
  create: (data: any): Promise<Product> => {
    return api.post('/products', data);
  },
  update: (id: string, data: any): Promise<Product> => {
    return api.put(`/products/${id}`, data);
  },
  delete: (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/products/${id}`);
  },
};
