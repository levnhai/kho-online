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
    async getDashboard(range = '7days') {
        const now = new Date();
        let startDate = new Date();
        let chartData = [];
        let rangeLabel = '7 ngày qua';
        if (range === 'today') {
            rangeLabel = 'Hôm nay';
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const timeSlots = [
                { label: '00:00 - 04:00', startH: 0, endH: 4 },
                { label: '04:00 - 08:00', startH: 4, endH: 8 },
                { label: '08:00 - 12:00', startH: 8, endH: 12 },
                { label: '12:00 - 16:00', startH: 12, endH: 16 },
                { label: '16:00 - 20:00', startH: 16, endH: 20 },
                { label: '20:00 - 24:00', startH: 20, endH: 24 },
            ];
            for (const slot of timeSlots) {
                const slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slot.startH, 0, 0);
                const slotEnd = slot.endH === 24
                    ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
                    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), slot.endH, 0, 0);
                const rev = await this.orderModel.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: slotStart, $lte: slotEnd },
                            status: { $ne: order_schema_1.OrderStatus.CANCELLED },
                        },
                    },
                    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
                ]);
                chartData.push({
                    date: slot.label,
                    revenue: rev[0]?.total || 0,
                    orders: rev[0]?.count || 0,
                });
            }
        }
        else if (range === 'month') {
            rangeLabel = 'Tháng này';
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            const weeks = [
                { label: 'Tuần 1 (1-7)', startDay: 1, endDay: 7 },
                { label: 'Tuần 2 (8-14)', startDay: 8, endDay: 14 },
                { label: 'Tuần 3 (15-21)', startDay: 15, endDay: 21 },
                { label: 'Tuần 4 (22+)', startDay: 22, endDay: 31 },
            ];
            for (const w of weeks) {
                const wStart = new Date(now.getFullYear(), now.getMonth(), w.startDay, 0, 0, 0);
                const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const actualEndDay = Math.min(w.endDay, lastDayOfMonth);
                const wEnd = new Date(now.getFullYear(), now.getMonth(), actualEndDay, 23, 59, 59, 999);
                const rev = await this.orderModel.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: wStart, $lte: wEnd },
                            status: { $ne: order_schema_1.OrderStatus.CANCELLED },
                        },
                    },
                    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
                ]);
                chartData.push({
                    date: w.label,
                    revenue: rev[0]?.total || 0,
                    orders: rev[0]?.count || 0,
                });
            }
        }
        else if (range === 'year') {
            rangeLabel = 'Năm nay';
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            for (let m = 0; m < 12; m++) {
                const mStart = new Date(now.getFullYear(), m, 1, 0, 0, 0);
                const mEnd = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);
                const rev = await this.orderModel.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: mStart, $lte: mEnd },
                            status: { $ne: order_schema_1.OrderStatus.CANCELLED },
                        },
                    },
                    { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
                ]);
                chartData.push({
                    date: `Tháng ${m + 1}`,
                    revenue: rev[0]?.total || 0,
                    orders: rev[0]?.count || 0,
                });
            }
        }
        else {
            rangeLabel = '7 ngày qua';
            const d7 = new Date();
            d7.setDate(d7.getDate() - 6);
            startDate = new Date(d7.getFullYear(), d7.getMonth(), d7.getDate(), 0, 0, 0, 0);
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
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
                chartData.push({
                    date: dayName,
                    revenue: dayRevenue[0]?.total || 0,
                    orders: dayRevenue[0]?.count || 0,
                });
            }
        }
        const [totalProducts, periodOrdersCount, allTimeOrdersCount, periodCustomersCount, allTimeCustomersCount, periodRevenueAgg, allTimeRevenueAgg, topSelling, recentOrders,] = await Promise.all([
            this.productModel.countDocuments({ status: 'active' }),
            this.orderModel.countDocuments({ createdAt: { $gte: startDate } }),
            this.orderModel.countDocuments(),
            this.userModel.countDocuments({ role: 'customer', createdAt: { $gte: startDate } }),
            this.userModel.countDocuments({ role: 'customer' }),
            this.orderModel.aggregate([
                {
                    $match: {
                        createdAt: { $gte: startDate },
                        status: { $ne: order_schema_1.OrderStatus.CANCELLED },
                    },
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
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
        const periodRevenue = periodRevenueAgg[0]?.total || 0;
        const allTimeRevenue = allTimeRevenueAgg[0]?.total || 0;
        return {
            range,
            rangeLabel,
            metrics: {
                totalProducts,
                totalOrders: periodOrdersCount,
                allTimeOrders: allTimeOrdersCount,
                totalCustomers: periodCustomersCount || allTimeCustomersCount,
                allTimeCustomers: allTimeCustomersCount,
                totalRevenue: periodRevenue,
                allTimeRevenue,
            },
            topSelling,
            recentOrders,
            revenueChart: chartData,
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