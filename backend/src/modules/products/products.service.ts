import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly eventsGateway: EventsGateway,
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
      const cleanSub = String(subcategory).trim();
      const escaped = cleanSub.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      filter.subcategory = { $regex: new RegExp(`^${escaped}$`, 'i') };
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

    let sortOption: any = { isPinned: -1, createdAt: -1 };
    if (sort === 'price-asc') sortOption = { isPinned: -1, price: 1 };
    else if (sort === 'price-desc') sortOption = { isPinned: -1, price: -1 };
    else if (sort === 'top-sales') sortOption = { isPinned: -1, soldCount: -1 };
    else if (sort === 'name-asc') sortOption = { isPinned: -1, name: 1 };
    else if (sort === 'newest') sortOption = { isPinned: -1, createdAt: -1 };

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
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findBestSellers(limit = 8) {
    return this.productModel
      .find({ status: 'active' })
      .populate('category', 'name slug')
      .sort({ isPinned: -1, soldCount: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findNewArrivals(limit = 8) {
    return this.productModel
      .find({ status: 'active' })
      .populate('category', 'name slug')
      .sort({ isPinned: -1, createdAt: -1 })
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

  async findBatch(ids: string[]): Promise<ProductDocument[]> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return [];
    }
    return this.productModel
      .find({ _id: { $in: ids } })
      .populate('category', 'name slug')
      .exec();
  }

  async create(createDto: any): Promise<ProductDocument> {
    const existing = await this.productModel.findOne({ code: createDto.code.toUpperCase() });
    if (existing) {
      throw new BadRequestException('Mã sản phẩm đã tồn tại');
    }
    if (createDto.isPinned) {
      const pinnedCount = await this.productModel.countDocuments({ isPinned: true });
      if (pinnedCount >= 5) {
        throw new BadRequestException('Chỉ được phép ghim tối đa 5 sản phẩm. Vui lòng bỏ ghim sản phẩm khác trước.');
      }
    }
    const product = new this.productModel({
      ...createDto,
      code: createDto.code.toUpperCase(),
    });
    const saved = await product.save();
    const populated = await saved.populate('category', 'name slug');
    this.eventsGateway.notifyProductUpdated(populated);
    return populated;
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
    if (updateDto.isPinned) {
      const pinnedCount = await this.productModel.countDocuments({
        isPinned: true,
        _id: { $ne: id },
      });
      if (pinnedCount >= 5) {
        throw new BadRequestException('Chỉ được phép ghim tối đa 5 sản phẩm. Vui lòng bỏ ghim sản phẩm khác trước.');
      }
    }
    const updated = await this.productModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('category', 'name slug')
      .exec();
    if (!updated) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    this.eventsGateway.notifyProductUpdated(updated);
    return updated;
  }

  async togglePin(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    if (!product.isPinned) {
      const pinnedCount = await this.productModel.countDocuments({ isPinned: true });
      if (pinnedCount >= 5) {
        throw new BadRequestException('Chỉ được phép ghim tối đa 5 sản phẩm. Vui lòng bỏ ghim sản phẩm khác trước.');
      }
    }
    product.isPinned = !product.isPinned;
    await product.save();
    const populated = await product.populate('category', 'name slug');
    this.eventsGateway.notifyProductUpdated(populated);
    return populated;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.productModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    this.eventsGateway.notifyProductDeleted(id);
    return { success: true, message: 'Đã xóa sản phẩm' };
  }

  async countAll(): Promise<number> {
    return this.productModel.countDocuments();
  }
}
