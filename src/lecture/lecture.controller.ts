import {
  Get,
  Body,
  Post,
  Query,
  Param,
  Patch,
  Delete,
  Headers,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

import {
  CreateLectureDto,
  UpdateLectureDto,
  GetLectureByIdDto,
  ReArrangeLectureDto,
  ListLectureGroupsDto,
  CreateLectureGroupDto,
  DeleteLectureGroupDto,
  ListLecturesPreviewDto,
  ListLecturesEnrolledDto,
  TrackLectureProgressDto,
  ReArrangeLectureGroupDto,
  ListLecturesInstructorDto,
  GetLectureByIdInstructorDto,
  ListLecturesGroupedEnrolledDto,
} from './lecture.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { LectureService } from './lecture.service';
import { GetUser } from '../auth/get-user.decorator';
import { GetRealIp } from '../auth/get-ip.decorator';

@Controller('lecture')
export class LectureController {
  constructor(private lectureService: LectureService) {}

  @Post('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async createLecture(
    @Body() dto: CreateLectureDto,
    @GetUser() instructor: User,
    @GetRealIp() ip: string,
  ) {
    const res = await this.lectureService.createLecture(dto, instructor, ip);
    return res;
  }

  @Patch('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async updateLecture(
    @Body() dto: UpdateLectureDto,
    @GetUser() instructor: User,
    @GetRealIp() ip: string,
  ) {
    const res = await this.lectureService.updateLecture(dto, instructor, ip);
    return res;
  }

  @Get('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listLecturesInstructor(
    @Query() dto: ListLecturesInstructorDto,
    @GetUser() instructor: User,
    @GetRealIp() ip: string,
  ) {
    const res = await this.lectureService.listLecturesInstructor(
      dto,
      instructor,
      ip,
    );
    return res;
  }

  @Post('instructor/rearrange')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async reArrangeLectures(
    @Body() dto: ReArrangeLectureDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.lectureService.reArrangeLecture(dto);
    return res;
  }

  @Get('instructor/group')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listLectureGroups(
    @Query() dto: ListLectureGroupsDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.lectureService.listLectureGroups(dto);
    return res;
  }

  @Post('instructor/group')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async createLectureGroup(
    @Body() dto: CreateLectureGroupDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.lectureService.createLectureGroup(dto);
    return res;
  }

  @Delete('instructor/group')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async deleteLectureGroup(
    @Body() dto: DeleteLectureGroupDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.lectureService.deleteLectureGroup(dto);
    return res;
  }

  @Post('instructor/group/rearrange')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async reArrangeLectureGroup(
    @Body() dto: ReArrangeLectureGroupDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.lectureService.reArrangeLectureGroup(dto);
    return res;
  }

  @Get('list-enrolled')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listLecturesEnrolled(
    @Query() dto: ListLecturesEnrolledDto,
    @GetUser() student: User,
    @GetRealIp() ip: string,
  ) {
    dto.ip = ip;
    dto.student = student;
    const res = await this.lectureService.listLecturesEnrolled(dto);
    return res;
  }

  @Get('enrolled')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listLecturesGroupedEnrolled(
    @Query() dto: ListLecturesGroupedEnrolledDto,
    @GetUser() student: User,
    @GetRealIp() ip: string,
  ) {
    dto.ip = ip;
    dto.student = student;
    const res = await this.lectureService.listLecuturesGroupedEnrolled(dto);
    return res;
  }

  @Get('video/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async getLectureVideo(
    @Param() dto: GetLectureByIdDto,
    @GetUser() student: User,
    @GetRealIp() ip: string,
  ) {
    dto.ip = ip;
    dto.student = student;
    const res = await this.lectureService.getLectureVideo(dto);
    return res;
  }

  @Post('progress')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async trackLectureProgress(
    @Body() dto: TrackLectureProgressDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.lectureService.trackLectureProgress(dto);
    return res;
  }

  // @Get(':id')
  // @UseGuards(JwtAuthGuard, RoleGuard)
  // @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  // async getLectureById(
  //   @Param() dto: GetLectureByIdDto,
  //   @GetRealIp() ip: string,
  //   @GetUser() student: User,
  // ) {
  //   dto.ip = ip;
  //   dto.student = student;
  //   const res = await this.lectureService.getLectureById(dto);
  //   return res;
  // }

  @Get('instructor/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async getLectureByIdInstructor(
    @Param() dto: GetLectureByIdInstructorDto,
    @GetUser() instructor: User,
    @GetRealIp() ip: string,
  ) {
    dto.ip = ip;
    dto.instructor = instructor;
    const res = await this.lectureService.getLectureByIdInstructor(dto);
    return res;
  }

  @Get('')
  async listLectures(
    @Query() dto: ListLecturesPreviewDto,
    @GetRealIp() ip: string,
  ) {
    const res = await this.lectureService.listLecturesPreview(dto, ip);
    return res;
  }
}
