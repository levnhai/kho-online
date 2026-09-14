import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SetOptionDocument = SetOption & Document;

@Schema({ timestamps: true })
export class SetOption {
  @Prop({ required: true, trim: true, unique: true })
  name: string; // Tên món, ví dụ: "Cả Set", "Lẻ Áo", "Lẻ Quần", "Lẻ Váy", "Lẻ Áo Khoác"

  @Prop({ trim: true, uppercase: true, default: '' })
  code?: string; // Mã phân loại tùy chọn, ví dụ: "SET", "AO", "QUAN", "VAY"

  @Prop({ default: '', trim: true })
  description?: string; // Mô tả ghi chú

  @Prop({ default: 0 })
  order: number; // Thứ tự hiển thị

  @Prop({ default: true })
  isActive: boolean; // Trạng thái kích hoạt
}

export const SetOptionSchema = SchemaFactory.createForClass(SetOption);
