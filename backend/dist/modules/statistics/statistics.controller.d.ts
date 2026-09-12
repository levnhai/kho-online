import { StatisticsService } from './statistics.service';
export declare class StatisticsController {
    private readonly statisticsService;
    constructor(statisticsService: StatisticsService);
    getDashboard(range?: 'today' | '7days' | 'month' | 'year'): Promise<{
        range: "today" | "7days" | "month" | "year";
        rangeLabel: string;
        metrics: {
            totalProducts: number;
            totalOrders: number;
            allTimeOrders: number;
            totalCustomers: number;
            allTimeCustomers: number;
            totalRevenue: any;
            allTimeRevenue: any;
        };
        topSelling: (import("mongoose").FlattenMaps<import("../products/schemas/product.schema").ProductDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        recentOrders: (import("mongoose").FlattenMaps<import("../orders/schemas/order.schema").OrderDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        revenueChart: {
            date: string;
            revenue: number;
            orders: number;
        }[];
    }>;
    getSalesReport(range?: 'today' | 'week' | 'month' | 'year'): Promise<{
        range: "today" | "month" | "year" | "week";
        startDate: Date;
        revenue: number;
        orderCount: number;
        productSalesList: {
            name: string;
            sold: number;
            revenue: number;
        }[];
    }>;
}
