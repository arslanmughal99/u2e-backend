import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { RoleGuard } from '../auth/role.guard';
import { User, UserRole } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { DashbaordService } from './dashbaord.service';
import { DashboardInstructorDto, DashboardStudentDto } from './dashboard.dto';

@Controller('dashboard')
export class DashbaordController {
  constructor(private dashboardService: DashbaordService) {}

  @Get('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async getInstructorDashboardData(
    @Query() dto: DashboardInstructorDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;

    const res = await this.dashboardService.getInstructorDashboardData(dto);

    return res;
  }

  @Get('student')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student)
  async getStudentDashboardData(
    @Query() dto: DashboardStudentDto,
    @GetUser() student: User,
  ) {
    dto.student = student;
    const res = await this.dashboardService.getStudentDashboardData(dto);

    return res;
  }
}
