"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const product_schema_1 = require("./schemas/product.schema");
let ProductsService = class ProductsService {
    constructor(productModel) {
        this.productModel = productModel;
    }
    async findAll(query = {}) {
        const { search, category, subcategory, minPrice, maxPrice, sort = 'newest', status, page = 1, limit = 12, } = query;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        else if (!query.allStatus) {
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
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined && minPrice !== '') {
                filter.price.$gte = Number(minPrice);
            }
            if (maxPrice !== undefined && maxPrice !== '') {
                filter.price.$lte = Number(maxPrice);
            }
        }
        let sortOption = { createdAt: -1 };
        if (sort === 'price-asc')
            sortOption = { price: 1 };
        else if (sort === 'price-desc')
            sortOption = { price: -1 };
        else if (sort === 'top-sales')
            sortOption = { soldCount: -1 };
        else if (sort === 'name-asc')
            sortOption = { name: 1 };
        else if (sort === 'newest')
            sortOption = { createdAt: -1 };
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
    async findById(id) {
        const product = await this.productModel
            .findById(id)
            .populate('category', 'name slug')
            .exec();
        if (!product) {
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm');
        }
        return product;
    }
    async create(createDto) {
        const existing = await this.productModel.findOne({ code: createDto.code.toUpperCase() });
        if (existing) {
            throw new common_1.BadRequestException('Mã sản phẩm đã tồn tại');
        }
        const product = new this.productModel({
            ...createDto,
            code: createDto.code.toUpperCase(),
        });
        return product.save();
    }
    async update(id, updateDto) {
        if (updateDto.code) {
            updateDto.code = updateDto.code.toUpperCase();
            const existing = await this.productModel.findOne({
                code: updateDto.code,
                _id: { $ne: id },
            });
            if (existing) {
                throw new common_1.BadRequestException('Mã sản phẩm đã tồn tại ở sản phẩm khác');
            }
        }
        const updated = await this.productModel
            .findByIdAndUpdate(id, updateDto, { new: true })
            .populate('category', 'name slug')
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm');
        }
        return updated;
    }
    async delete(id) {
        const deleted = await this.productModel.findByIdAndDelete(id).exec();
        if (!deleted) {
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm');
        }
        return { success: true, message: 'Đã xóa sản phẩm' };
    }
    async countAll() {
        return this.productModel.countDocuments();
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ProductsService);
//# sourceMappingURL=products.service.js.map