import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ColorsService } from './colors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('colors')
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  @Get()
  async findAll() {
    return this.colorsService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.colorsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body()
    createDto: {
      name: string;
      code: string;
      hexCode: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
    return this.colorsService.create(createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    updateDto: {
      name?: string;
      code?: string;
      hexCode?: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
    return this.colorsService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.colorsService.delete(id);
  }
}
