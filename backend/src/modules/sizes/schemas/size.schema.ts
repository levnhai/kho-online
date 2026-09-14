import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SizeDocument = Size & Document;

@Schema({ timestamps: true })
export class Size {
  @Prop({ required: true, trim: true, unique: true })
  name: string; // Tên size, ví dụ: "S", "M", "L", "XL", "XXL", "FreeSize", "28", "29", "30"

  @Prop({ trim: true, uppercase: true, default: '' })
  code?: string; // Mã size (nếu có)

  @Prop({ default: '', trim: true })
  description?: string; // Mô tả ghi chú

  @Prop({ default: 0 })
  order: number; // Thứ tự hiển thị

  @Prop({ default: true })
  isActive: boolean; // Trạng thái kích hoạt
}

export const SizeSchema = SchemaFactory.createForClass(Size);
