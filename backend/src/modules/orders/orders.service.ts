import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private generateOrderCode(): string {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `#DH${randomNum}`;
  }

  async create(userId: string, createOrderDto: any): Promise<any> {
    const { items, customerInfo, paymentMethod } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Giỏ hàng không có sản phẩm');
    }

    const createdOrders: OrderDocument[] = [];

    for (const item of items) {
      const product = await this.productModel.findById(item.product);
      if (!product) {
        throw new NotFoundException(`Sản phẩm với ID ${item.product} không tồn tại`);
      }
      // Hàng luôn luôn còn nên không cần kiểm tra tồn kho

      const itemPrice = item.price && item.price > 0 ? item.price : (product.salePrice && product.salePrice > 0 ? product.salePrice : product.price);
      const total = itemPrice * item.quantity;
      const subtotal = total;
      const shippingFee = subtotal >= 5000000 ? 0 : 30000;
      const totalAmount = subtotal + shippingFee;

      const orderItem = {
        product: product._id,
        productCode: product.code || item.productCode || '',
        name: item.name || product.name,
        sellingOption: item.sellingOption || '',
        size: item.size || '',
        color: item.color || '',
        price: itemPrice,
        quantity: item.quantity,
        image: item.image || product.images?.[0] || '',
        total: subtotal,
      };

      // Trừ tồn kho và tăng lượt bán
      await this.productModel.findByIdAndUpdate(product._id, {
        $inc: { soldCount: item.quantity },
      });

      let orderCode = this.generateOrderCode();
      let existing = await this.orderModel.findOne({ orderCode });
      while (existing) {
        orderCode = this.generateOrderCode();
        existing = await this.orderModel.findOne({ orderCode });
      }

      const order = new this.orderModel({
        orderCode,
        customer: new mongoose.Types.ObjectId(userId),
        customerInfo,
        items: [orderItem],
        subtotal,
        shippingFee,
        totalAmount,
        paymentMethod: paymentMethod || 'COD',
        status: OrderStatus.PENDING,
        orderDate: new Date(),
      });

      const savedOrder = await order.save();
      this.eventsGateway.notifyOrderCreated(savedOrder);
      createdOrders.push(savedOrder);
    }

    const orderCodes = createdOrders.map((o) => o.orderCode);
    return {
      orderCode: orderCodes.join(', '),
      orderCodes,
      orders: createdOrders,
      count: createdOrders.length,
    };
  }

  async findMyOrders(userId: string): Promise<OrderDocument[]> {
    const userObjectId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;
    return this.orderModel
      .find({
        $or: [
          ...(userObjectId ? [{ customer: userObjectId }] : []),
          { customer: userId as any },
        ],
      })
      .populate('items.product', 'name code images')
      .sort({ createdAt: -1 })
      .exec();
  }

  async cancelMyOrder(userId: string, orderId: string): Promise<OrderDocument> {
    const userObjectId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const orderObjectId = mongoose.isValidObjectId(orderId) ? new mongoose.Types.ObjectId(orderId) : null;

    const order = await this.orderModel.findOne({
      ...(orderObjectId ? { _id: orderObjectId } : { _id: orderId }),
      $or: [
        ...(userObjectId ? [{ customer: userObjectId }] : []),
        { customer: userId as any },
      ],
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể huỷ đơn hàng khi đang ở trạng thái Chờ xử lý');
    }
    order.status = OrderStatus.CANCELLED;
    const savedOrder = await order.save();
    this.eventsGateway.notifyOrderCancelled(savedOrder);
    return savedOrder;
  }

  async findById(id: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name code images')
      .exec();
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return order;
  }

  async findAll(query: any = {}) {
    const { search, status, page = 1, limit = 10 } = query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      const q = search.trim();
      const matchedProducts = await this.productModel
        .find(
          {
            $or: [
              { code: { $regex: q, $options: 'i' } },
              { name: { $regex: q, $options: 'i' } },
            ],
          },
          { _id: 1 }
        )
        .exec();
      const productIds = matchedProducts.map((p) => p._id);

      filter.$or = [
        { orderCode: { $regex: q, $options: 'i' } },
        { 'customerInfo.name': { $regex: q, $options: 'i' } },
        { 'customerInfo.phone': { $regex: q, $options: 'i' } },
        { 'items.productCode': { $regex: q, $options: 'i' } },
        { 'items.name': { $regex: q, $options: 'i' } },
        ...(productIds.length > 0 ? [{ 'items.product': { $in: productIds } }] : []),
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .populate('customer', 'name email phone')
        .populate('items.product', 'name code images')
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

  async updateStatus(id: string, status: OrderStatus): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // Nếu đơn hàng bị huỷ từ trạng thái khác CANCELLED -> hoàn lại kho
    if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(item.product, {
          $inc: { soldCount: -item.quantity },
        });
      }
    }

    order.status = status;
    const savedOrder = await order.save();
    this.eventsGateway.notifyOrderStatusUpdated(savedOrder);
    return savedOrder;
  }

  async countOrders(): Promise<number> {
    return this.orderModel.countDocuments();
  }

  async getTotalRevenue(): Promise<number> {
    const result = await this.orderModel.aggregate([
      { $match: { status: { $ne: OrderStatus.CANCELLED } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return result[0]?.total || 0;
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // Giảm số lượt bán nếu đơn hàng chưa bị huỷ
    if (order.status !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        if (item.product) {
          await this.productModel.findByIdAndUpdate(item.product, {
            $inc: { soldCount: -item.quantity },
          });
        }
      }
    }

    await this.orderModel.findByIdAndDelete(id);
    return { success: true, message: 'Đã xóa đơn hàng thành công' };
  }

  async clearAllOrders(): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const res = await this.orderModel.deleteMany({});
    // Reset soldCount của tất cả sản phẩm về 0
    await this.productModel.updateMany({}, { soldCount: 0 });
    return {
      success: true,
      deletedCount: res.deletedCount || 0,
      message: `Đã xóa toàn bộ ${res.deletedCount || 0} đơn hàng và làm mới số liệu thống kê`,
    };
  }
}
