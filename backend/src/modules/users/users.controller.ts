import { Controller, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './schemas/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user._id);
  }

  @Put('profile')
  async updateProfile(@Request() req: any, @Body() updateDto: any) {
    return this.usersService.update(req.user._id, updateDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('customers')
  async getCustomers(@Query('search') search?: string) {
    return this.usersService.findAll(search);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id/status')
  async updateUserStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.update(id, { status });
  }
}
