import api from '@/shared/api/base';
import { ColorItem } from '@/shared/types';

export const colorApi = {
  getAll: (options?: { skipCache?: boolean }): Promise<ColorItem[]> => {
    return api.get('/colors', { skipCache: options?.skipCache });
  },
  getById: (id: string): Promise<ColorItem> => {
    return api.get(`/colors/${id}`);
  },
  create: (data: Partial<ColorItem>): Promise<ColorItem> => {
    return api.post('/colors', data);
  },
  update: (id: string, data: Partial<ColorItem>): Promise<ColorItem> => {
    return api.put(`/colors/${id}`, data);
  },
  delete: (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/colors/${id}`);
  },
};
