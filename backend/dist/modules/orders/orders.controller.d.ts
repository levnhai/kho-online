import { OrdersService } from './orders.service';
import { OrderStatus } from './schemas/order.schema';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: any, createOrderDto: any): Promise<import("./schemas/order.schema").OrderDocument>;
    findMyOrders(req: any): Promise<import("./schemas/order.schema").OrderDocument[]>;
    findAll(query: any): Promise<{
        items: (import("mongoose").Document<unknown, {}, import("./schemas/order.schema").OrderDocument, {}, {}> & import("./schemas/order.schema").Order & import("mongoose").Document<import("mongoose").Types.ObjectId, any, any, Record<string, any>, {}> & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<import("./schemas/order.schema").OrderDocument>;
    updateStatus(id: string, status: OrderStatus): Promise<import("./schemas/order.schema").OrderDocument>;
}
