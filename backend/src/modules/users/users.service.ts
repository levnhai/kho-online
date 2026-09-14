import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: any): Promise<UserDocument> {
    try {
      if (!createUserDto.password) {
        throw new BadRequestException('Mật khẩu không được để trống');
      }
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const data: any = {
        ...createUserDto,
        password: hashedPassword,
      };
      if (!data.email || !data.email.trim()) {
        delete data.email;
      }
      const user = new this.userModel(data);
      return await user.save();
    } catch (error: any) {
      console.error('LỖI USERS_SERVICE CREATE:', error);
      if (error.code === 11000) {
        const keyPattern = error.keyPattern || {};
        console.error('Duplicate key pattern:', keyPattern, 'keyValue:', error.keyValue);
        if (keyPattern.phone) {
          throw new BadRequestException('Số điện thoại này đã được đăng ký tài khoản');
        }
        if (keyPattern.email) {
          throw new BadRequestException('Email này đã được sử dụng');
        }
        const field = Object.keys(keyPattern)[0] || 'Thông tin';
        throw new BadRequestException(`${field} đã tồn tại trong hệ thống`);
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    if (!email) return null;
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    if (!phone) return null;
    return this.userModel.findOne({ phone: phone.trim() }).exec();
  }

  async findByEmailOrPhone(identifier: string): Promise<UserDocument | null> {
    const clean = identifier.trim();
    return this.userModel.findOne({
      $or: [
        { email: clean.toLowerCase() },
        { phone: clean },
      ],
    }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findAll(search?: string): Promise<any[]> {
    const filter: any = { role: 'customer' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    return this.userModel.find(filter).select('-password').sort({ createdAt: -1 }).exec();
  }

  async update(id: string, updateData: any): Promise<UserDocument> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();
    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return updatedUser;
  }

  async countCustomers(): Promise<number> {
    return this.userModel.countDocuments({ role: 'customer' });
  }
}
