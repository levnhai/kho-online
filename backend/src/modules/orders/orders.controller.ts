import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { OrderStatus } from './schemas/order.schema';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() createOrderDto: any) {
    return this.ordersService.create(req.user._id, createOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async findMyOrders(@Request() req: any) {
    return this.ordersService.findMyOrders(req.user._id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelMyOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.cancelMyOrder(req.user._id, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('clear/all')
  async clearAllOrders() {
    return this.ordersService.clearAllOrders();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('adminNote') adminNote?: string,
  ) {
    return this.ordersService.updateStatus(id, status, adminNote);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/admin-note')
  async updateAdminNote(
    @Param('id') id: string,
    @Body('adminNote') adminNote: string,
  ) {
    return this.ordersService.updateAdminNote(id, adminNote);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }
}
