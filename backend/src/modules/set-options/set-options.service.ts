import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SetOption, SetOptionDocument } from './schemas/set-option.schema';

@Injectable()
export class SetOptionsService implements OnModuleInit {
  constructor(
    @InjectModel(SetOption.name) private setOptionModel: Model<SetOptionDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    try {
      const count = await this.setOptionModel.countDocuments();
      if (count === 0) {
        const defaultOptions = [
          { name: 'Cả Set', code: 'SET', order: 1, description: 'Mua trọn bộ' },
          { name: 'Lẻ Áo', code: 'AO', order: 2, description: 'Mua lẻ riêng áo' },
          { name: 'Lẻ Quần', code: 'QUAN', order: 3, description: 'Mua lẻ riêng quần' },
          { name: 'Lẻ Váy', code: 'VAY', order: 4, description: 'Mua lẻ riêng váy' },
          { name: 'Lẻ Áo Khoác', code: 'AOKHOAC', order: 5, description: 'Mua lẻ riêng áo khoác' },
          { name: 'Lẻ Chân Váy', code: 'CHANVAY', order: 6, description: 'Mua lẻ riêng chân váy' },
          { name: 'Lẻ Nón / Phụ Kiện', code: 'NON', order: 7, description: 'Mua lẻ phụ kiện kèm theo' },
        ];
        await this.setOptionModel.insertMany(defaultOptions);
        console.log('Seed default set options completed.');
      }
    } catch (err) {
      console.error('Seed set options error:', err);
    }
  }

  async findAll(onlyActive: boolean = false): Promise<any[]> {
    const filter = onlyActive ? { isActive: true } : {};
    return this.setOptionModel.find(filter).sort({ order: 1, createdAt: 1 }).lean().exec();
  }

  async findById(id: string): Promise<SetOptionDocument> {
    const option = await this.setOptionModel.findById(id).exec();
    if (!option) {
      throw new NotFoundException('Không tìm thấy tùy chọn món');
    }
    return option;
  }

  async create(createDto: {
    name: string;
    code?: string;
    description?: string;
    order?: number;
    isActive?: boolean;
  }): Promise<SetOptionDocument> {
    const normalizedName = createDto.name?.trim();
    if (!normalizedName) {
      throw new BadRequestException('Tên món không được để trống');
    }

    const existing = await this.setOptionModel.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
    });

    if (existing) {
      throw new BadRequestException(`Tùy chọn món "${normalizedName}" đã tồn tại`);
    }

    const newOption = new this.setOptionModel({
      ...createDto,
      name: normalizedName,
      code: (createDto.code || normalizedName).trim().toUpperCase(),
      order: createDto.order !== undefined ? Number(createDto.order) : 0,
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
    });

    return newOption.save();
  }

  async update(
    id: string,
    updateDto: {
      name?: string;
      code?: string;
      description?: string;
      order?: number;
      isActive?: boolean;
    },
  ): Promise<SetOptionDocument> {
    const option = await this.setOptionModel.findById(id);
    if (!option) {
      throw new NotFoundException('Không tìm thấy tùy chọn món');
    }

    if (updateDto.name && updateDto.name.trim().toLowerCase() !== option.name.toLowerCase()) {
      const dup = await this.setOptionModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${updateDto.name.trim()}$`, 'i') },
      });
      if (dup) {
        throw new BadRequestException(`Tùy chọn món "${updateDto.name.trim()}" đã tồn tại`);
      }
    }

    const payload: any = { ...updateDto };
    if (updateDto.name) payload.name = updateDto.name.trim();
    if (updateDto.code) payload.code = updateDto.code.trim().toUpperCase();
    if (updateDto.order !== undefined) payload.order = Number(updateDto.order);

    const updated = await this.setOptionModel.findByIdAndUpdate(id, payload, { new: true }).exec();
    return updated;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const option = await this.setOptionModel.findById(id);
    if (!option) {
      throw new NotFoundException('Không tìm thấy tùy chọn món');
    }

    await this.setOptionModel.findByIdAndDelete(id).exec();
    return { success: true, message: `Đã xóa món "${option.name}" thành công` };
  }
}
