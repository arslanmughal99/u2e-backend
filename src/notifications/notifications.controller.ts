import { User, UserRole } from '@prisma/client';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import {
  RegisterNotificationDto,
  UserListNotificationsDto,
  InstructorCourseNotificationDto,
  InstructorListSendNotificationsDto,
} from './notifications.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notification')
export class NotificationsController {
  constructor(private notificationService: NotificationsService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.Admin,
    UserRole.Student,
    UserRole.Instructor,
    UserRole.Organization,
  )
  async registerDevice(
    @Body() dto: RegisterNotificationDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.notificationService.registerNotification(dto);
    return res;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listUserNotifications(
    @GetUser() user: User,
    @Query() dto: UserListNotificationsDto,
  ) {
    dto.user = user;

    const res = await this.notificationService.listUserNotifications(dto);
    return res;
  }

  @Get('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listInstructorSendNotifications(
    @GetUser() instructor: User,
    @Query() dto: InstructorListSendNotificationsDto,
  ) {
    dto.instructor = instructor;

    const res = await this.notificationService.listInstructorSendNotifications(
      dto,
    );
    return res;
  }

  @Post('instructor/course')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async sendCourseNotification(
    @GetUser() instructor: User,
    @Body() dto: InstructorCourseNotificationDto,
  ) {
    dto.instructor = instructor;

    const res = await this.notificationService.instructorCourseNotification(
      dto,
    );
    return res;
  }
}
