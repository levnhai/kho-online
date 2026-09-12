import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ImportDocument = Import & Document;

export class ImportItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Product', default: null })
  product?: string;

  @Prop({ default: '' })
  productCode?: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ default: '' })
  productImage?: string;

  @Prop({ default: '' })
  size?: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  importPrice: number;

  @Prop({ required: true, min: 0 })
  total: number;
}

@Schema({ timestamps: true })
export class Import {
  @Prop({ required: true, unique: true })
  importCode: string;

  @Prop({ default: '' })
  orderName?: string;

  @Prop({ default: '' })
  productCode?: string;

  @Prop({ default: '' })
  image?: string;

  @Prop({ required: true })
  supplier: string;

  @Prop({ type: [ImportItem], required: true })
  items: ImportItem[];

  @Prop({ required: true, min: 1 })
  totalQuantity: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ default: '' })
  note?: string;

  @Prop({
    default: 'ORDERED',
    enum: ['ORDERED', 'KHO_TRUNG', 'KHO_VIET', 'SHIPPING', 'COMPLETED', 'CANCELLED', 'SUCCESS'],
  })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: any;
}

export const ImportSchema = SchemaFactory.createForClass(Import);
