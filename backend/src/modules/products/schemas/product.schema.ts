import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from '../../categories/schemas/category.schema';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
export class ProductSellingOption {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;
}

export const ProductSellingOptionSchema =
  SchemaFactory.createForClass(ProductSellingOption);

@Schema({ _id: false })
export class ProductSize {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  salePrice: number;

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ default: '', trim: true })
  sku: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  optionPrices?: Record<string, number>;
}

export const ProductSizeSchema = SchemaFactory.createForClass(ProductSize);

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  code: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  category: Category;

  @Prop({ default: '', trim: true })
  subcategory?: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: 0, min: 0 })
  salePrice: number;

  @Prop({ required: true, default: 0, min: 0 })
  stock: number;

  @Prop({ type: [ProductSellingOptionSchema], default: [] })
  sellingOptions: ProductSellingOption[];

  @Prop({ type: [ProductSizeSchema], default: [] })
  sizes: ProductSize[];

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Object, default: {} })
  specifications: Record<string, string>;

  @Prop({ default: 0 })
  soldCount: number;

  @Prop({ default: 5, min: 1, max: 5 })
  rating: number;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: 'active', enum: ['active', 'inactive'] })
  status: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
