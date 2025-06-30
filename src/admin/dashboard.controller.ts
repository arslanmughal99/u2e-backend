import { UserRole } from '@prisma/client';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGetDashboardDto } from './dto/dashboard.dto';
import { AdminDashboardService } from './dashboard.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RoleGuard)
export class DashboardController {
  constructor(private dashboardService: AdminDashboardService) {}

  @Get()
  @Roles(UserRole.Admin)
  async getAdminDashboardData(@Query() dto: AdminGetDashboardDto) {
    const res = await this.dashboardService.getAdminDashboardData(dto);
    return res;
  }
}
