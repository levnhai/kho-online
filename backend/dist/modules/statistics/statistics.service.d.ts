import { Model } from 'mongoose';
import { OrderDocument } from '../orders/schemas/order.schema';
import { ProductDocument } from '../products/schemas/product.schema';
import { UserDocument } from '../users/schemas/user.schema';
export declare class StatisticsService {
    private orderModel;
    private productModel;
    private userModel;
    constructor(orderModel: Model<OrderDocument>, productModel: Model<ProductDocument>, userModel: Model<UserDocument>);
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
        topSelling: (import("mongoose").FlattenMaps<ProductDocument> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        recentOrders: (import("mongoose").FlattenMaps<OrderDocument> & Required<{
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
