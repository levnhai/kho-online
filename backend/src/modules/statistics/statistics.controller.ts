import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.statisticsService.getDashboard();
  }

  @Get('sales-report')
  async getSalesReport(@Query('range') range?: 'today' | 'week' | 'month' | 'year') {
    return this.statisticsService.getSalesReport(range || 'month');
  }
}
