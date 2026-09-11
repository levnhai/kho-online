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
exports.StatisticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("../orders/schemas/order.schema");
const product_schema_1 = require("../products/schemas/product.schema");
const user_schema_1 = require("../users/schemas/user.schema");
let StatisticsService = class StatisticsService {
    constructor(orderModel, productModel, userModel) {
        this.orderModel = orderModel;
        this.productModel = productModel;
        this.userModel = userModel;
    }
    async getDashboard() {
        const [totalProducts, totalOrders, totalCustomers, revenueAgg, topSelling, recentOrders] = await Promise.all([
            this.productModel.countDocuments({ status: 'active' }),
            this.orderModel.countDocuments(),
            this.userModel.countDocuments({ role: 'customer' }),
            this.orderModel.aggregate([
                { $match: { status: { $ne: order_schema_1.OrderStatus.CANCELLED } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            this.productModel
                .find({ status: 'active' })
                .sort({ soldCount: -1 })
                .limit(5)
                .select('name code price salePrice soldCount images')
                .lean()
                .exec(),
            this.orderModel
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('customer', 'name email')
                .lean()
                .exec(),
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
            const dayRevenue = await this.orderModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startOfDay, $lte: endOfDay },
                        status: { $ne: order_schema_1.OrderStatus.CANCELLED },
                    },
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
            ]);
            const dayName = `${d.getDate()}/${d.getMonth() + 1}`;
            last7Days.push({
                date: dayName,
                revenue: dayRevenue[0]?.total || 0,
                orders: dayRevenue[0]?.count || 0,
            });
        }
        return {
            metrics: {
                totalProducts,
                totalOrders,
                totalCustomers,
                totalRevenue,
            },
            topSelling,
            recentOrders,
            revenueChart: last7Days,
        };
    }
    async getSalesReport(range = 'month') {
        const now = new Date();
        let startDate = new Date();
        if (range === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        else if (range === 'week') {
            const day = now.getDay() || 7;
            startDate.setDate(now.getDate() - day + 1);
            startDate.setHours(0, 0, 0, 0);
        }
        else if (range === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        else if (range === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        }
        const ordersInRange = await this.orderModel
            .find({
            createdAt: { $gte: startDate },
            status: { $ne: order_schema_1.OrderStatus.CANCELLED },
        })
            .lean()
            .exec();
        const revenue = ordersInRange.reduce((sum, ord) => sum + ord.totalAmount, 0);
        const orderCount = ordersInRange.length;
        const productSalesMap = {};
        for (const ord of ordersInRange) {
            for (const item of ord.items) {
                const pId = item.product.toString();
                if (!productSalesMap[pId]) {
                    productSalesMap[pId] = {
                        name: item.name,
                        sold: 0,
                        revenue: 0,
                    };
                }
                productSalesMap[pId].sold += item.quantity;
                productSalesMap[pId].revenue += item.total;
            }
        }
        const productSalesList = Object.values(productSalesMap).sort((a, b) => b.sold - a.sold);
        return {
            range,
            startDate,
            revenue,
            orderCount,
            productSalesList,
        };
    }
};
exports.StatisticsService = StatisticsService;
exports.StatisticsService = StatisticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], StatisticsService);
//# sourceMappingURL=statistics.service.js.map