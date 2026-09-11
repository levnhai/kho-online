import { StatisticsService } from './statistics.service';
export declare class StatisticsController {
    private readonly statisticsService;
    constructor(statisticsService: StatisticsService);
    getDashboard(): Promise<{
        metrics: {
            totalProducts: number;
            totalOrders: number;
            totalCustomers: number;
            totalRevenue: any;
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
        revenueChart: any[];
    }>;
    getSalesReport(range?: 'today' | 'week' | 'month' | 'year'): Promise<{
        range: "today" | "week" | "month" | "year";
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
