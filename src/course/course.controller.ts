import {
  Get,
  Body,
  Post,
  Patch,
  Query,
  Param,
  Headers,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

import {
  UpdateCourseDto,
  CreateCourseDto,
  PublishCourseDto,
  GetCourseByIdDto,
  ListPublicCoursesDto,
  ListCourseReviewsDto,
  CreateCourseReviewDto,
  ListEnrolledCoursesDto,
  ListInstructorCoursesDto,
  GetEnrolledCourseByIdDto,
  GetCourseProgressDto,
} from './course.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CourseService } from './course.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('course')
export class CourseController {
  constructor(private courseService: CourseService) {}

  @Get('')
  async listPublicCourses(
    @Query() dto: ListPublicCoursesDto,
    @Headers('Authorization')
    authToken?: string,
  ) {
    const res = await this.courseService.listCourse(dto, authToken);
    return res;
  }

  @Get('popular')
  async listPopularCourses(
    @Headers('Authorization')
    authToken?: string,
  ) {
    const res = await this.courseService.listPopularCourses(authToken);
    return res;
  }

  @Get('best-selling')
  async listBestSellerCourse(
    @Headers('Authorization')
    authToken?: string,
  ) {
    const res = await this.courseService.listBestSellerCourses(authToken);
    return res;
  }

  @Post('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async createCourse(
    @Body() dto: CreateCourseDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.courseService.createCourse(dto);
    return res;
  }

  @Patch('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async updateCourse(
    @Body() dto: UpdateCourseDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.courseService.updateCourse(dto);
    return res;
  }

  @Patch('instructor/publish')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async publishCourse(
    @Body() dto: PublishCourseDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.courseService.publishCourse(dto);
    return res;
  }

  @Get('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listInstructorCourses(
    @GetUser() instructor: User,
    @Query() dto: ListInstructorCoursesDto,
  ) {
    const res = await this.courseService.listInstructorCourse(dto, instructor);
    return res;
  }

  @Get('/enrolled')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listEnrolledCourses(
    @GetUser() student: User,
    @Query() dto: ListEnrolledCoursesDto,
  ) {
    const res = await this.courseService.listEnrolledCourse(dto, student);
    return res;
  }

  @Get('categories')
  async listCategories() {
    const res = await this.courseService.listCategories();
    return res;
  }

  @Get('review')
  async listReviews(@Query() dto: ListCourseReviewsDto) {
    const res = await this.courseService.listReviews(dto);
    return res;
  }

  @Post('review')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor)
  async createReview(
    @Body() dto: CreateCourseReviewDto,
    @GetUser() student: User,
  ) {
    dto.user = student;
    const res = await this.courseService.createReview(dto, student);
    return res;
  }

  @Get('progress')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async getCourseProgress(
    @Query() dto: GetCourseProgressDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.courseService.getCourseProgress(dto);
    return res;
  }

  @Get('all')
  async getAllCourseIds() {
    const ids = await this.courseService.getAllCoursesIds();
    return ids;
  }

  @Get('/enrolled/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async getEnrolledCourseById(
    @Param() dto: GetEnrolledCourseByIdDto,
    @GetUser() student: User,
  ) {
    dto.student = student;
    const res = await this.courseService.getEnrolledCourseDetailsById(dto);
    return res;
  }

  @Get(':id')
  async getCourseById(@Param() dto: GetCourseByIdDto) {
    const res = await this.courseService.getCourseDetailsById(dto);
    return res;
  }
}
