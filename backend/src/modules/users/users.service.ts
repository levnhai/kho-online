import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: any): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return user.save();
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
