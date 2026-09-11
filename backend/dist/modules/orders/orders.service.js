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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("./schemas/order.schema");
const product_schema_1 = require("../products/schemas/product.schema");
let OrdersService = class OrdersService {
    constructor(orderModel, productModel) {
        this.orderModel = orderModel;
        this.productModel = productModel;
    }
    generateOrderCode() {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        return `#DH${randomNum}`;
    }
    async create(userId, createOrderDto) {
        const { items, customerInfo, paymentMethod } = createOrderDto;
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('Giỏ hàng không có sản phẩm');
        }
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await this.productModel.findById(item.product);
            if (!product) {
                throw new common_1.NotFoundException(`Sản phẩm với ID ${item.product} không tồn tại`);
            }
            if (product.stock < item.quantity) {
                throw new common_1.BadRequestException(`Sản phẩm ${product.name} chỉ còn lại ${product.stock} chiếc`);
            }
            const effectivePrice = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
            const total = effectivePrice * item.quantity;
            subtotal += total;
            orderItems.push({
                product: product._id,
                name: product.name,
                price: effectivePrice,
                quantity: item.quantity,
                image: product.images?.[0] || '',
                total,
            });
            await this.productModel.findByIdAndUpdate(product._id, {
                $inc: { stock: -item.quantity, soldCount: item.quantity },
            });
        }
        const shippingFee = subtotal >= 5000000 ? 0 : 30000;
        const totalAmount = subtotal + shippingFee;
        let orderCode = this.generateOrderCode();
        let existing = await this.orderModel.findOne({ orderCode });
        while (existing) {
            orderCode = this.generateOrderCode();
            existing = await this.orderModel.findOne({ orderCode });
        }
        const order = new this.orderModel({
            orderCode,
            customer: userId,
            customerInfo,
            items: orderItems,
            subtotal,
            shippingFee,
            totalAmount,
            paymentMethod: paymentMethod || 'COD',
            status: order_schema_1.OrderStatus.PENDING,
            orderDate: new Date(),
        });
        return order.save();
    }
    async findMyOrders(userId) {
        return this.orderModel
            .find({ customer: userId })
            .sort({ createdAt: -1 })
            .exec();
    }
    async findById(id) {
        const order = await this.orderModel.findById(id).populate('customer', 'name email phone').exec();
        if (!order) {
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        }
        return order;
    }
    async findAll(query = {}) {
        const { search, status, page = 1, limit = 10 } = query;
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                { orderCode: { $regex: search, $options: 'i' } },
                { 'customerInfo.name': { $regex: search, $options: 'i' } },
                { 'customerInfo.phone': { $regex: search, $options: 'i' } },
            ];
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            this.orderModel
                .find(filter)
                .populate('customer', 'name email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .exec(),
            this.orderModel.countDocuments(filter),
        ]);
        return {
            items,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)) || 1,
        };
    }
    async updateStatus(id, status) {
        const order = await this.orderModel.findById(id);
        if (!order) {
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        }
        if (status === order_schema_1.OrderStatus.CANCELLED && order.status !== order_schema_1.OrderStatus.CANCELLED) {
            for (const item of order.items) {
                await this.productModel.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity, soldCount: -item.quantity },
                });
            }
        }
        order.status = status;
        return order.save();
    }
    async countOrders() {
        return this.orderModel.countDocuments();
    }
    async getTotalRevenue() {
        const result = await this.orderModel.aggregate([
            { $match: { status: { $ne: order_schema_1.OrderStatus.CANCELLED } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        return result[0]?.total || 0;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], OrdersService);
//# sourceMappingURL=orders.service.js.map