import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ColorDocument = Color & Document;

@Schema({ timestamps: true })
export class Color {
  @Prop({ required: true, trim: true, unique: true })
  name: string; // Tên màu, ví dụ: "Đen", "Trắng", "Xanh Navy"

  @Prop({ required: true, trim: true, uppercase: true, unique: true })
  code: string; // Mã ký hiệu màu, ví dụ: "M1", "M2", "DEN", "TRANG"

  @Prop({ required: true, trim: true, uppercase: true, default: '#000000' })
  hexCode: string; // Mã màu HEX hiển thị, ví dụ: "#000000", "#FFFFFF", "#1E3A8A"

  @Prop({ default: '', trim: true })
  description?: string; // Ghi chú mô tả thêm

  @Prop({ default: true })
  isActive: boolean; // Trạng thái kích hoạt
}

export const ColorSchema = SchemaFactory.createForClass(Color);
