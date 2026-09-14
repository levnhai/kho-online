import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Color, ColorDocument } from './schemas/color.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class ColorsService {
  constructor(
    @InjectModel(Color.name) private colorModel: Model<ColorDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(): Promise<any[]> {
    const colors = await this.colorModel.find().sort({ createdAt: -1 }).lean().exec();

    // Thống kê sơ bộ số lượng sản phẩm có gắn màu này
    const result = await Promise.all(
      colors.map(async (c) => {
        const count = await this.productModel.countDocuments({
          colors: { $in: [c.name, c.code] },
        });
        return {
          ...c,
          productCount: count,
        };
      }),
    );
    return result;
  }

  async findById(id: string): Promise<ColorDocument> {
    const color = await this.colorModel.findById(id).exec();
    if (!color) {
      throw new NotFoundException('Không tìm thấy màu sắc');
    }
    return color;
  }

  async create(createDto: {
    name: string;
    code: string;
    hexCode: string;
    description?: string;
    isActive?: boolean;
  }): Promise<ColorDocument> {
    const normalizedName = createDto.name?.trim();
    const normalizedCode = (createDto.code || createDto.name).trim().toUpperCase();

    const existing = await this.colorModel.findOne({
      $or: [{ name: normalizedName }, { code: normalizedCode }],
    });

    if (existing) {
      if (existing.name.toLowerCase() === normalizedName.toLowerCase()) {
        throw new BadRequestException(`Tên màu "${normalizedName}" đã tồn tại`);
      }
      throw new BadRequestException(`Mã màu "${normalizedCode}" đã tồn tại`);
    }

    const newColor = new this.colorModel({
      ...createDto,
      name: normalizedName,
      code: normalizedCode,
      hexCode: createDto.hexCode ? createDto.hexCode.trim().toUpperCase() : '#000000',
      isActive: createDto.isActive !== undefined ? createDto.isActive : true,
    });

    return newColor.save();
  }

  async update(
    id: string,
    updateDto: {
      name?: string;
      code?: string;
      hexCode?: string;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<ColorDocument> {
    const color = await this.colorModel.findById(id);
    if (!color) {
      throw new NotFoundException('Không tìm thấy màu sắc');
    }

    if (updateDto.name && updateDto.name.trim() !== color.name) {
      const dup = await this.colorModel.findOne({
        _id: { $ne: id },
        name: updateDto.name.trim(),
      });
      if (dup) {
        throw new BadRequestException(`Tên màu "${updateDto.name.trim()}" đã tồn tại`);
      }
    }

    if (updateDto.code && updateDto.code.trim().toUpperCase() !== color.code) {
      const dup = await this.colorModel.findOne({
        _id: { $ne: id },
        code: updateDto.code.trim().toUpperCase(),
      });
      if (dup) {
        throw new BadRequestException(`Mã màu "${updateDto.code.trim().toUpperCase()}" đã tồn tại`);
      }
    }

    const payload: any = { ...updateDto };
    if (updateDto.name) payload.name = updateDto.name.trim();
    if (updateDto.code) payload.code = updateDto.code.trim().toUpperCase();
    if (updateDto.hexCode) payload.hexCode = updateDto.hexCode.trim().toUpperCase();

    const updated = await this.colorModel.findByIdAndUpdate(id, payload, { new: true }).exec();
    return updated;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const color = await this.colorModel.findById(id);
    if (!color) {
      throw new NotFoundException('Không tìm thấy màu sắc');
    }

    // Kiểm tra xem có sản phẩm nào đang dùng màu này không
    const productsUsing = await this.productModel.countDocuments({
      colors: { $in: [color.name, color.code] },
    });

    if (productsUsing > 0) {
      throw new BadRequestException(
        `Không thể xóa màu "${color.name}" vì đang được sử dụng trong ${productsUsing} sản phẩm. Bạn có thể chuyển trạng thái sang Tạm ẩn (Inactive).`,
      );
    }

    await this.colorModel.findByIdAndDelete(id).exec();
    return { success: true, message: `Đã xóa màu ${color.name} (${color.code}) thành công` };
  }
}
