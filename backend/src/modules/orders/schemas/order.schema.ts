import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'PENDING',       // Chờ xác nhận
  CONFIRMED = 'CONFIRMED',   // Đã xác nhận
  SHIPPING = 'SHIPPING',     // Đang giao
  DELIVERED = 'DELIVERED',   // Đã giao
  CANCELLED = 'CANCELLED',   // Đã hủy
  FAILED = 'FAILED',         // Giao hàng thất bại
}

export enum PaymentMethod {
  COD = 'COD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  ONLINE = 'ONLINE',
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true })
  product: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '', trim: true })
  size: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ default: '' })
  image: string;

  @Prop({ required: true })
  total: number;
}

@Schema({ _id: false })
export class CustomerInfo {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop({ default: '' })
  note: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, uppercase: true })
  orderCode: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  customer: User;

  @Prop({ type: CustomerInfo, required: true })
  customerInfo: CustomerInfo;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  subtotal: number;

  @Prop({ default: 0 })
  shippingFee: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: PaymentMethod.COD, enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ default: OrderStatus.PENDING, enum: OrderStatus })
  status: OrderStatus;

  @Prop({ default: Date.now })
  orderDate: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
