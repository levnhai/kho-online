import api from '@/shared/api/base';
import { SetOptionItem } from '@/shared/types';

export const setOptionApi = {
  getAll: (options?: { skipCache?: boolean; onlyActive?: boolean }): Promise<SetOptionItem[]> => {
    return api.get('/set-options', {
      params: { onlyActive: options?.onlyActive },
      skipCache: options?.skipCache,
    });
  },
  getById: (id: string): Promise<SetOptionItem> => {
    return api.get(`/set-options/${id}`);
  },
  create: (data: Partial<SetOptionItem>): Promise<SetOptionItem> => {
    return api.post('/set-options', data);
  },
  update: (id: string, data: Partial<SetOptionItem>): Promise<SetOptionItem> => {
    return api.put(`/set-options/${id}`, data);
  },
  delete: (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/set-options/${id}`);
  },
};
