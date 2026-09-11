import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(): Promise<any[]> {
    const categories = await this.categoryModel.find().sort({ createdAt: -1 }).lean().exec();
    
    // Đếm số sản phẩm cho mỗi thể loại
    const result = await Promise.all(
      categories.map(async (cat) => {
        const count = await this.productModel.countDocuments({ category: cat._id, status: 'active' });
        return {
          ...cat,
          productCount: count,
        };
      }),
    );
    return result;
  }

  async findById(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy thể loại');
    }
    return category;
  }

  async create(createDto: any): Promise<CategoryDocument> {
    const slug = createDto.slug || createDto.name.toLowerCase().replace(/\s+/g, '-');
    const existing = await this.categoryModel.findOne({ $or: [{ name: createDto.name }, { slug }] });
    if (existing) {
      throw new BadRequestException('Thể loại hoặc slug này đã tồn tại');
    }
    const cat = new this.categoryModel({
      ...createDto,
      slug,
    });
    return cat.save();
  }

  async update(id: string, updateDto: any): Promise<CategoryDocument> {
    const updated = await this.categoryModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException('Không tìm thấy thể loại');
    }
    return updated;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const productsInCat = await this.productModel.countDocuments({ category: id });
    if (productsInCat > 0) {
      throw new BadRequestException(`Không thể xóa vì còn ${productsInCat} sản phẩm thuộc thể loại này`);
    }
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Không tìm thấy thể loại');
    }
    return { success: true, message: 'Đã xóa thể loại thành công' };
  }
}
