import api from '@/shared/api/base';
import { Order, OrderStatus } from '@/shared/types';

export interface OrdersResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const orderApi = {
  create: (data: any): Promise<Order> => {
    return api.post('/orders', data);
  },
  getMyOrders: (): Promise<Order[]> => {
    return api.get('/orders/my-orders');
  },
  getAll: (params?: any): Promise<OrdersResponse> => {
    return api.get('/orders', { params });
  },
  getById: (id: string): Promise<Order> => {
    return api.get(`/orders/${id}`);
  },
  updateStatus: (id: string, status: OrderStatus): Promise<Order> => {
    return api.patch(`/orders/${id}/status`, { status });
  },
  cancelMyOrder: (id: string): Promise<Order> => {
    return api.patch(`/orders/${id}/cancel`);
  },
};
