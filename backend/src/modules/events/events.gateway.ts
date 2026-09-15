import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Khách hàng hoặc Admin tham gia room tương ứng
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId?: string; role?: string },
  ) {
    if (data?.role === 'admin') {
      client.join('admin_orders');
      this.logger.log(`Admin client ${client.id} joined room: admin_orders`);
    }

    if (data?.userId) {
      client.join(`user_${data.userId}`);
      this.logger.log(`User client ${client.id} joined room: user_${data.userId}`);
    }

    return { status: 'joined', ...data };
  }

  // Khi có đơn hàng mới được tạo -> Bắn tới room admin
  notifyOrderCreated(order: any) {
    this.logger.log(`Emitting order_created for order #${order.orderCode}`);
    this.server.to('admin_orders').emit('order_created', order);
  }

  // Khi trạng thái đơn hàng thay đổi -> Bắn tới room khách hàng và room admin
  notifyOrderStatusUpdated(order: any) {
    this.logger.log(`Emitting order_status_updated for order #${order.orderCode}`);
    const customerId = typeof order.customer === 'object' ? order.customer?._id : order.customer;
    if (customerId) {
      this.server.to(`user_${customerId}`).emit('order_status_updated', order);
    }
    this.server.to('admin_orders').emit('order_status_updated', order);
  }

  // Khi đơn hàng bị huỷ -> Bắn tới room khách hàng và room admin
  notifyOrderCancelled(order: any) {
    this.logger.log(`Emitting order_cancelled for order #${order.orderCode}`);
    const customerId = typeof order.customer === 'object' ? order.customer?._id : order.customer;
    if (customerId) {
      this.server.to(`user_${customerId}`).emit('order_cancelled', order);
    }
    this.server.to('admin_orders').emit('order_cancelled', order);
  }

  // Khi sản phẩm được tạo / sửa đổi (giá, phân loại, trạng thái) -> Bắn tới toàn bộ client
  notifyProductUpdated(product: any) {
    this.logger.log(`Emitting PRODUCT_UPDATED for product ${product._id || product.id} (${product.name})`);
    this.server.emit('PRODUCT_UPDATED', product);
    this.server.emit('product_updated', product);
  }

  // Khi sản phẩm bị xóa -> Bắn tới toàn bộ client
  notifyProductDeleted(productId: string) {
    this.logger.log(`Emitting PRODUCT_DELETED for productId ${productId}`);
    this.server.emit('PRODUCT_DELETED', { productId });
    this.server.emit('product_deleted', { productId });
  }
}
