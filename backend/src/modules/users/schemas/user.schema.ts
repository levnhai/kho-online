import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '', lowercase: true, trim: true })
  email?: string;

  @Prop({ required: true, unique: true, trim: true })
  phone: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: UserRole.CUSTOMER, enum: UserRole })
  role: UserRole;

  @Prop({ default: '' })
  address: string;

  @Prop({ default: 'active', enum: ['active', 'blocked'] })
  status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
