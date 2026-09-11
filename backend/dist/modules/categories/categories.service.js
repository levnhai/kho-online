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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const category_schema_1 = require("./schemas/category.schema");
const product_schema_1 = require("../products/schemas/product.schema");
let CategoriesService = class CategoriesService {
    constructor(categoryModel, productModel) {
        this.categoryModel = categoryModel;
        this.productModel = productModel;
    }
    async findAll() {
        const categories = await this.categoryModel.find().sort({ createdAt: -1 }).lean().exec();
        const result = await Promise.all(categories.map(async (cat) => {
            const count = await this.productModel.countDocuments({ category: cat._id, status: 'active' });
            return {
                ...cat,
                productCount: count,
            };
        }));
        return result;
    }
    async findById(id) {
        const category = await this.categoryModel.findById(id).exec();
        if (!category) {
            throw new common_1.NotFoundException('Không tìm thấy thể loại');
        }
        return category;
    }
    async create(createDto) {
        const slug = createDto.slug || createDto.name.toLowerCase().replace(/\s+/g, '-');
        const existing = await this.categoryModel.findOne({ $or: [{ name: createDto.name }, { slug }] });
        if (existing) {
            throw new common_1.BadRequestException('Thể loại hoặc slug này đã tồn tại');
        }
        const cat = new this.categoryModel({
            ...createDto,
            slug,
        });
        return cat.save();
    }
    async update(id, updateDto) {
        const updated = await this.categoryModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
        if (!updated) {
            throw new common_1.NotFoundException('Không tìm thấy thể loại');
        }
        return updated;
    }
    async delete(id) {
        const productsInCat = await this.productModel.countDocuments({ category: id });
        if (productsInCat > 0) {
            throw new common_1.BadRequestException(`Không thể xóa vì còn ${productsInCat} sản phẩm thuộc thể loại này`);
        }
        const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
        if (!deleted) {
            throw new common_1.NotFoundException('Không tìm thấy thể loại');
        }
        return { success: true, message: 'Đã xóa thể loại thành công' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(category_schema_1.Category.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map