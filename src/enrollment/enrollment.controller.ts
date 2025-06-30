import { User, UserRole } from '@prisma/client';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import {
  ListEnrollmentsDto,
  GetEnrollmentAnalyticsDto,
  UpdateEnrollmentStatusDto,
} from './enrollment.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { GetRealIp } from '../auth/get-ip.decorator';
import { EnrollmentService } from './enrollment.service';

@Controller('enrollment')
export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listEnrollments(
    @Query() dto: ListEnrollmentsDto,
    @GetUser() instructor: User,
    @GetRealIp() ip: string,
  ) {
    const res = await this.enrollmentService.listEnrollments(
      dto,
      ip,
      instructor,
    );
    return res;
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async getEnrollmentAnalytics(
    @Query() dto: GetEnrollmentAnalyticsDto,
    @GetUser() instructor: User,
  ) {
    const res = await this.enrollmentService.getEnrollmentsAnalytics(
      dto,
      instructor,
    );
    return res;
  }

  @Post('status')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async updateStudentEnrollmentStatus(
    @GetUser() student: User,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    dto.student = student;
    const r = await this.enrollmentService.updateEnrollmentStatus(dto);
    return r;
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async getStudentEnrollmentsStats(@GetUser() student: User) {
    const r = await this.enrollmentService.getStudentEnrollmentsStats(student);
    return r;
  }
  // @Post('enroll')
  // @UseGuards(JwtAuthGuard, RoleGuard)
  // @Roles(UserRole.Student, UserRole.Instructor)
  // async enroll(@Body() dto: EnrollDto, @GetUser() user: User) {
  //   const res = await this.enrollmentService.enroll(dto, user);
  //   return res;
  // }
}
