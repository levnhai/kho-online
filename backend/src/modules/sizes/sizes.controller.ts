import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SizesService } from './sizes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('sizes')
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Get()
  async findAll(@Query('onlyActive') onlyActive?: string) {
    return this.sizesService.findAll(onlyActive === 'true');
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.sizesService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body()
    createDto: {
      name: string;
      code?: string;
      description?: string;
      order?: number;
      isActive?: boolean;
    },
  ) {
    return this.sizesService.create(createDto);
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
      description?: string;
      order?: number;
      isActive?: boolean;
    },
  ) {
    return this.sizesService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.sizesService.delete(id);
  }
}
