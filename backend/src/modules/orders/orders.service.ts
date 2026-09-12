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

  async create(userId: string, createOrderDto: any): Promise<OrderDocument> {
    const { items, customerInfo, paymentMethod } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Giỏ hàng không có sản phẩm');
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await this.productModel.findById(item.product);
      if (!product) {
        throw new NotFoundException(`Sản phẩm với ID ${item.product} không tồn tại`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Sản phẩm ${product.name} chỉ còn lại ${product.stock} chiếc`);
      }

      const itemPrice = item.price && item.price > 0 ? item.price : (product.salePrice && product.salePrice > 0 ? product.salePrice : product.price);
      const total = itemPrice * item.quantity;
      subtotal += total;

      orderItems.push({
        product: product._id,
        name: item.name || product.name,
        size: item.size || '',
        color: item.color || '',
        price: itemPrice,
        quantity: item.quantity,
        image: item.image || product.images?.[0] || '',
        total,
      });

      // Trừ tồn kho và tăng lượt bán
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
      customer: new mongoose.Types.ObjectId(userId),
      customerInfo,
      items: orderItems,
      subtotal,
      shippingFee,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      status: OrderStatus.PENDING,
      orderDate: new Date(),
    });

    const savedOrder = await order.save();
    this.eventsGateway.notifyOrderCreated(savedOrder);
    return savedOrder;
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
    const order = await this.orderModel.findById(id).populate('customer', 'name email phone').exec();
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

  async updateStatus(id: string, status: OrderStatus): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id);
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // Nếu đơn hàng bị huỷ từ trạng thái khác CANCELLED -> hoàn lại kho
    if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      for (const item of order.items) {
        await this.productModel.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity, soldCount: -item.quantity },
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
}
