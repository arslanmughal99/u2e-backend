import {
  Get,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import {
  AdminListCoursesDto,
  AdminUpdateCourseDto,
  AdminGetCourseByIdDto,
} from './dto/course.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminCourseService } from './course.service';

@Controller('admin/course')
@UseGuards(JwtAuthGuard, RoleGuard)
export class CourseController {
  constructor(private courseService: AdminCourseService) {}

  @Get()
  @Roles(UserRole.Admin)
  async listCourse(@Query() dto: AdminListCoursesDto) {
    const res = await this.courseService.listCourses(dto);
    return res;
  }

  @Patch()
  @Roles(UserRole.Admin)
  async updateCourse(@Body() dto: AdminUpdateCourseDto) {
    const res = await this.courseService.updateCourse(dto);
    return res;
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  async getCourseById(@Param() dto: AdminGetCourseByIdDto) {
    const res = await this.courseService.getCourseById(dto);
    return res;
  }
}
