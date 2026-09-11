import { Model } from 'mongoose';
import { OrderDocument } from '../orders/schemas/order.schema';
import { ProductDocument } from '../products/schemas/product.schema';
import { UserDocument } from '../users/schemas/user.schema';
export declare class StatisticsService {
    private orderModel;
    private productModel;
    private userModel;
    constructor(orderModel: Model<OrderDocument>, productModel: Model<ProductDocument>, userModel: Model<UserDocument>);
    getDashboard(): Promise<{
        metrics: {
            totalProducts: number;
            totalOrders: number;
            totalCustomers: number;
            totalRevenue: any;
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
