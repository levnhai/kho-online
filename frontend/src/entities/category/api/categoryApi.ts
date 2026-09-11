import api from '@/shared/api/base';
import { Category } from '@/shared/types';

export const categoryApi = {
  getAll: (): Promise<Category[]> => {
    return api.get('/categories');
  },
  getById: (id: string): Promise<Category> => {
    return api.get(`/categories/${id}`);
  },
  create: (data: any): Promise<Category> => {
    return api.post('/categories', data);
  },
  update: (id: string, data: any): Promise<Category> => {
    return api.put(`/categories/${id}`, data);
  },
  delete: (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/categories/${id}`);
  },
};
