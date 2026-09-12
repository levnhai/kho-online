import { Order, Product } from '@/shared/types';

export interface DashboardMetrics {
  totalProducts: number;
  totalOrders: number;
  allTimeOrders?: number;
  totalCustomers: number;
  allTimeCustomers?: number;
  totalRevenue: number;
  allTimeRevenue?: number;
}

export interface RevenueChartItem {
  date: string;
  revenue: number;
  orders: number;
}

export interface DashboardData {
  range?: string;
  rangeLabel?: string;
  metrics: DashboardMetrics;
  topSelling: (Product & { soldCount: number })[];
  recentOrders: Order[];
  revenueChart: RevenueChartItem[];
}

export interface SalesReportProduct {
  name: string;
  sold: number;
  revenue: number;
}

export interface SalesReportData {
  range: 'today' | 'week' | 'month' | 'year';
  startDate: string;
  revenue: number;
  orderCount: number;
  productSalesList: SalesReportProduct[];
}
