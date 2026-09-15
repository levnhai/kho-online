import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(query: any = {}) {
    const {
      search,
      category,
      subcategory,
      minPrice,
      maxPrice,
      sort = 'newest',
      status,
      page = 1,
      limit = 12,
    } = query;

    const filter: any = {};

    if (status) {
      filter.status = status;
    } else if (!query.allStatus) {
      filter.status = 'active';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (subcategory) {
      filter.subcategory = subcategory;
    }

    if (query.type === 'set') {
      filter['sellingOptions.0'] = { $exists: true };
    } else if (query.type === 'single') {
      if (filter.$or) {
        const searchOr = filter.$or;
        delete filter.$or;
        filter.$and = [
          { $or: searchOr },
          {
            $or: [
              { sellingOptions: { $exists: false } },
              { sellingOptions: { $size: 0 } },
              { sellingOptions: null },
            ],
          },
        ];
      } else {
        filter.$or = [
          { sellingOptions: { $exists: false } },
          { sellingOptions: { $size: 0 } },
          { sellingOptions: null },
        ];
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '') {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        filter.price.$lte = Number(maxPrice);
      }
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price-desc') sortOption = { price: -1 };
    else if (sort === 'top-sales') sortOption = { soldCount: -1 };
    else if (sort === 'name-asc') sortOption = { name: 1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .lean()
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  async findFeatured(limit = 8) {
    return this.productModel
      .find({ status: 'active', isFeatured: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findBestSellers(limit = 8) {
    return this.productModel
      .find({ status: 'active' })
      .populate('category', 'name slug')
      .sort({ soldCount: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findNewArrivals(limit = 8) {
    return this.productModel
      .find({ status: 'active' })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findById(id: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name slug')
      .exec();
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return product;
  }

  async create(createDto: any): Promise<ProductDocument> {
    const existing = await this.productModel.findOne({ code: createDto.code.toUpperCase() });
    if (existing) {
      throw new BadRequestException('Mã sản phẩm đã tồn tại');
    }
    const product = new this.productModel({
      ...createDto,
      code: createDto.code.toUpperCase(),
    });
    return product.save();
  }

  async update(id: string, updateDto: any): Promise<ProductDocument> {
    if (updateDto.code) {
      updateDto.code = updateDto.code.toUpperCase();
      const existing = await this.productModel.findOne({
        code: updateDto.code,
        _id: { $ne: id },
      });
      if (existing) {
        throw new BadRequestException('Mã sản phẩm đã tồn tại ở sản phẩm khác');
      }
    }
    const updated = await this.productModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('category', 'name slug')
      .exec();
    if (!updated) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return updated;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.productModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return { success: true, message: 'Đã xóa sản phẩm' };
  }

  async countAll(): Promise<number> {
    return this.productModel.countDocuments();
  }
}
