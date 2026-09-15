import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get('featured')
  async findFeatured(@Query('limit') limit?: number) {
    return this.productsService.findFeatured(limit ? Number(limit) : 8);
  }

  @Get('best-sellers')
  async findBestSellers(@Query('limit') limit?: number) {
    return this.productsService.findBestSellers(limit ? Number(limit) : 8);
  }

  @Get('new-arrivals')
  async findNewArrivals(@Query('limit') limit?: number) {
    return this.productsService.findNewArrivals(limit ? Number(limit) : 8);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post('batch')
  async findBatch(@Body() body: { ids: string[] }) {
    return this.productsService.findBatch(body.ids || []);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@Body() createDto: any) {
    return this.productsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.productsService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/toggle-pin')
  async togglePin(@Param('id') id: string) {
    return this.productsService.togglePin(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
