import api from '@/shared/api/base';
import { DashboardData, SalesReportData } from '../model/types';

export const statApi = {
  getDashboard: (params?: { range?: 'today' | '7days' | 'month' | 'year' }): Promise<DashboardData> => {
    return api.get('/statistics/dashboard', { params });
  },
  getSalesReport: (range: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<SalesReportData> => {
    return api.get('/statistics/sales-report', { params: { range } });
  },
};
