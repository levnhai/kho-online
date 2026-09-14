import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Size, SizeDocument } from './schemas/size.schema';

@Injectable()
export class SizesService implements OnModuleInit {
  constructor(
    @InjectModel(Size.name) private sizeModel: Model<SizeDocument>,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    try {
      const count = await this.sizeModel.countDocuments();
      if (count === 0) {
        const defaultSizes = [
          { name: 'S', code: 'S', order: 1, description: 'Size Nhỏ (Small)' },
          { name: 'M', code: 'M', order: 2, description: 'Size Vừa (Medium)' },
          { name: 'L', code: 'L', order: 3, description: 'Size Lớn (Large)' },
          { name: 'XL', code: 'XL', order: 4, description: 'Size Rất lớn (Extra Large)' },
          { name: 'XXL', code: 'XXL', order: 5, description: 'Size Cực lớn (Double Extra Large)' },
          { name: 'FreeSize', code: 'FS', order: 6, description: 'Kích cỡ tự do, phù hợp mọi vóc dáng' },
          { name: '28', code: '28', order: 7, description: 'Size Quần 28' },
          { name: '29', code: '29', order: 8, description: 'Size Quần 29' },
          { name: '30', code: '30', order: 9, description: 'Size Quần 30' },
          { name: '31', code: '31', order: 10, description: 'Size Quần 31' },
          { name: '32', code: '32', order: 11, description: 'Size Quần 32' },
        ];
        await this.sizeModel.insertMany(defaultSizes);
        console.log('Seed default sizes completed.');
      }
    } catch (err) {
      console.error('Seed sizes error:', err);
    }
  }

  async findAll(onlyActive: boolean = false): Promise<any[]> {
    const filter = onlyActive ? { isActive: true } : {};
    return this.sizeModel.find(filter).sort({ order: 1, createdAt: 1 }).lean().exec();
  }

  async findById(id: string): Promise<SizeDocument> {
    const size = await this.sizeModel.findById(id).exec();
    if (!size) {
      throw new NotFoundException('Không tìm thấy kích thước (Size)');
    }
    return size;
  }

  async create(createDto: {
    name: string;
    code?: string;
    description?: string;
    order?: number;
    isActive?: boolean;
  }): Promise<SizeDocument> {
    const normalizedName = createDto.name?.trim();
    if (!normalizedName) {
      throw new BadRequestException('Tên size không được để trống');
    }

    const existing = await this.sizeModel.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
    });

    if (existing) {
      throw new BadRequestException(`Size "${normalizedName}" đã tồn tại trong hệ thống`);
    }

    const newSize = new this.sizeModel({
      ...createDto,
      name: normalizedName,
      code: (createDto.code || normalizedName).trim().toUpperCase(),
      order: createDto.order !== undefined ? Number(createDto.order) : 0,
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
    });

    return newSize.save();
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
  ): Promise<SizeDocument> {
    const size = await this.sizeModel.findById(id);
    if (!size) {
      throw new NotFoundException('Không tìm thấy kích thước (Size)');
    }

    if (updateDto.name && updateDto.name.trim().toLowerCase() !== size.name.toLowerCase()) {
      const dup = await this.sizeModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${updateDto.name.trim()}$`, 'i') },
      });
      if (dup) {
        throw new BadRequestException(`Size "${updateDto.name}" đã tồn tại trong hệ thống`);
      }
      size.name = updateDto.name.trim();
    }

    if (updateDto.code !== undefined) {
      size.code = updateDto.code.trim().toUpperCase();
    }
    if (updateDto.description !== undefined) {
      size.description = updateDto.description.trim();
    }
    if (updateDto.order !== undefined) {
      size.order = Number(updateDto.order);
    }
    if (updateDto.isActive !== undefined) {
      size.isActive = Boolean(updateDto.isActive);
    }

    return size.save();
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const size = await this.sizeModel.findById(id);
    if (!size) {
      throw new NotFoundException('Không tìm thấy kích thước (Size)');
    }
    await this.sizeModel.findByIdAndDelete(id).exec();
    return { success: true, message: `Đã xóa kích cỡ "${size.name}" thành công` };
  }
}
