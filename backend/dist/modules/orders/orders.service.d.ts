import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { ProductDocument } from '../products/schemas/product.schema';
export declare class OrdersService {
    private orderModel;
    private productModel;
    constructor(orderModel: Model<OrderDocument>, productModel: Model<ProductDocument>);
    private generateOrderCode;
    create(userId: string, createOrderDto: any): Promise<OrderDocument>;
    findMyOrders(userId: string): Promise<OrderDocument[]>;
    findById(id: string): Promise<OrderDocument>;
    findAll(query?: any): Promise<{
        items: (import("mongoose").Document<unknown, {}, OrderDocument, {}, {}> & Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    updateStatus(id: string, status: OrderStatus): Promise<OrderDocument>;
    countOrders(): Promise<number>;
    getTotalRevenue(): Promise<number>;
}
