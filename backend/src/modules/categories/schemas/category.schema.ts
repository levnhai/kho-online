import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  icon: string;

  @Prop({ type: [String], default: [] })
  subcategories: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);
