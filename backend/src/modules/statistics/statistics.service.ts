import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getDashboard(range: 'today' | '7days' | 'month' | 'year' = '7days') {
    const now = new Date();
    let startDate = new Date();
    let chartData: Array<{ date: string; revenue: number; orders: number }> = [];
    let rangeLabel = '7 ngày qua';

    if (range === 'today') {
      rangeLabel = 'Hôm nay';
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      // 6 khung giờ trong ngày: 0h-4h, 4h-8h, 8h-12h, 12h-16h, 16h-20h, 20h-24h
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
        const slotEnd =
          slot.endH === 24
            ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), slot.endH, 0, 0);

        const rev = await this.orderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: slotStart, $lte: slotEnd },
              status: { $ne: OrderStatus.CANCELLED },
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
    } else if (range === 'month') {
      rangeLabel = 'Tháng này';
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      // 4 tuần trong tháng
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
              status: { $ne: OrderStatus.CANCELLED },
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
    } else if (range === 'year') {
      rangeLabel = 'Năm nay';
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

      // 12 tháng trong năm
      for (let m = 0; m < 12; m++) {
        const mStart = new Date(now.getFullYear(), m, 1, 0, 0, 0);
        const mEnd = new Date(now.getFullYear(), m + 1, 0, 23, 59, 59, 999);

        const rev = await this.orderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: mStart, $lte: mEnd },
              status: { $ne: OrderStatus.CANCELLED },
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
    } else {
      // Mặc định: 7 ngày gần nhất
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
              status: { $ne: OrderStatus.CANCELLED },
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

    // Lấy số liệu tổng hợp trong khoảng thời gian đã chọn
    const [
      totalProducts,
      periodOrdersCount,
      allTimeOrdersCount,
      periodCustomersCount,
      allTimeCustomersCount,
      periodRevenueAgg,
      allTimeRevenueAgg,
      topSelling,
      recentOrders,
    ] = await Promise.all([
      this.productModel.countDocuments({ status: 'active' }),
      this.orderModel.countDocuments({ createdAt: { $gte: startDate } }),
      this.orderModel.countDocuments(),
      this.userModel.countDocuments({ role: 'customer', createdAt: { $gte: startDate } }),
      this.userModel.countDocuments({ role: 'customer' }),
      this.orderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $ne: OrderStatus.CANCELLED },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      this.orderModel.aggregate([
        { $match: { status: { $ne: OrderStatus.CANCELLED } } },
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

  async getSalesReport(range: 'today' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate = new Date();

    if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'week') {
      const day = now.getDay() || 7;
      startDate.setDate(now.getDate() - day + 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const ordersInRange = await this.orderModel
      .find({
        createdAt: { $gte: startDate },
        status: { $ne: OrderStatus.CANCELLED },
      })
      .lean()
      .exec();

    const revenue = ordersInRange.reduce((sum, ord) => sum + ord.totalAmount, 0);
    const orderCount = ordersInRange.length;

    // Tính số lượng bán của từng sản phẩm trong khoảng thời gian này
    const productSalesMap: Record<string, { name: string; sold: number; revenue: number }> = {};
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
}
