import api from '@/shared/api/base';
import { User } from '@/shared/types';

export const userApi = {
  getProfile: (): Promise<User> => {
    return api.get('/users/profile');
  },
  updateProfile: (data: any): Promise<User> => {
    return api.put('/users/profile', data);
  },
  getCustomers: (search?: string): Promise<User[]> => {
    return api.get('/users/customers', { params: { search } });
  },
  updateStatus: (id: string, status: string): Promise<User> => {
    return api.put(`/users/${id}/status`, { status });
  },
};
