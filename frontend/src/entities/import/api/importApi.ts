import api from '@/shared/api/base';
import { ImportReceipt, CreateImportDto } from '@/shared/types';

export interface ImportsResponse {
  items: ImportReceipt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const importApi = {
  create: (data: CreateImportDto): Promise<ImportReceipt> => {
    return api.post('/imports', data);
  },
  getAll: (params?: any): Promise<ImportsResponse> => {
    return api.get('/imports', { params });
  },
  getById: (id: string): Promise<ImportReceipt> => {
    return api.get(`/imports/${id}`);
  },
  update: (id: string, data: Partial<CreateImportDto>): Promise<ImportReceipt> => {
    return api.patch(`/imports/${id}`, data);
  },
  updateStatus: (id: string, status: string): Promise<ImportReceipt> => {
    return api.patch(`/imports/${id}/status`, { status });
  },
  delete: (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete(`/imports/${id}`);
  },
};
