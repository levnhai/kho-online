import api from '@/shared/api/base';

export const statApi = {
  getDashboard: (): Promise<any> => {
    return api.get('/statistics/dashboard');
  },
  getSalesReport: (range: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<any> => {
    return api.get('/statistics/sales-report', { params: { range } });
  },
};
