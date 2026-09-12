import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { CreateImportDto } from './dto/create-import.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('imports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post()
  async create(@Request() req: any, @Body() createImportDto: CreateImportDto) {
    return this.importsService.create(req.user._id, createImportDto);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.importsService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.importsService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.importsService.update(id, updateDto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.importsService.updateStatus(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.importsService.delete(id);
  }
}
