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

  async getDashboard() {
    const [totalProducts, totalOrders, totalCustomers, revenueAgg, topSelling, recentOrders] =
      await Promise.all([
        this.productModel.countDocuments({ status: 'active' }),
        this.orderModel.countDocuments(),
        this.userModel.countDocuments({ role: 'customer' }),
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

    const totalRevenue = revenueAgg[0]?.total || 0;

    // Biểu đồ doanh thu 7 ngày gần nhất
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
            status: { $ne: OrderStatus.CANCELLED },
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
