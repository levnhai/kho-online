import api from '@/shared/api/base';
import { SizeItem } from '@/shared/types';

export const sizeApi = {
  getAll: (options?: { skipCache?: boolean; onlyActive?: boolean }): Promise<SizeItem[]> => {
    return api.get('/sizes', {
      params: { onlyActive: options?.onlyActive },
      skipCache: options?.skipCache,
    });
  },
  getById: (id: string): Promise<SizeItem> => {
    return api.get(`/sizes/${id}`);
  },
  create: (data: Partial<SizeItem>): Promise<SizeItem> => {
    return api.post('/sizes', data);
  },
  update: (id: string, data: Partial<SizeItem>): Promise<SizeItem> => {
    return api.put(`/sizes/${id}`, data);
  },
  delete: (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/sizes/${id}`);
  },
};
