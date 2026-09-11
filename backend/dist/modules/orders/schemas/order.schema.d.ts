import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
export type OrderDocument = Order & Document;
export declare enum OrderStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    SHIPPING = "SHIPPING",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED"
}
export declare enum PaymentMethod {
    COD = "COD",
    BANK_TRANSFER = "BANK_TRANSFER",
    ONLINE = "ONLINE"
}
export declare class OrderItem {
    product: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    total: number;
}
export declare class CustomerInfo {
    name: string;
    phone: string;
    address: string;
    note: string;
}
export declare class Order {
    orderCode: string;
    customer: User;
    customerInfo: CustomerInfo;
    items: OrderItem[];
    subtotal: number;
    shippingFee: number;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    status: OrderStatus;
    orderDate: Date;
}
export declare const OrderSchema: MongooseSchema<Order, import("mongoose").Model<Order, any, any, any, Document<unknown, any, Order, any, {}> & Order & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Order, Document<unknown, {}, import("mongoose").FlatRecord<Order>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Order> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
