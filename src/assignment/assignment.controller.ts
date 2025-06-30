import {
  Get,
  Body,
  Post,
  Query,
  Patch,
  Param,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

import {
  ReplyAssignmentDto,
  ListUserAssignmentDto,
  UpdateActiveAssignmentDto,
  ListAssignmentCommentsDto,
  GetUserActiveAssignmentById,
  GetInstructorActiveAssignmentById,
} from './assignment.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { GetRealIp } from '../auth/get-ip.decorator';
import { AssignmentService } from './assignment.service';

@Controller('assignment')
export class AssignmentController {
  constructor(private assignmentService: AssignmentService) {}

  @Get('')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listUserActiveAssignments(
    @Query() dto: ListUserAssignmentDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.assignmentService.listUserAssignment(dto);
    return res;
  }

  @Get('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listInstructorActiveAssignments(
    @Query() dto: ListUserAssignmentDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.assignmentService.listInstructorActiveAssignment(
      dto,
    );
    return res;
  }

  @Patch('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async updateInstructorActiveAssignments(
    @Body() dto: UpdateActiveAssignmentDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.assignmentService.updateActiveAssignment(dto);
    return res;
  }

  @Get('comments')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listAssignmentComments(
    @Query() dto: ListAssignmentCommentsDto,
    @GetUser() user: User,
    @GetRealIp() ip: string,
  ) {
    dto.ip = ip;
    dto.user = user;
    const res = await this.assignmentService.listAssignmentComments(dto);
    return res;
  }

  @Post('reply')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async replyAssignment(
    @Body() dto: ReplyAssignmentDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.assignmentService.createAssignmentReply(dto);
    return res;
  }

  @Get('instructor/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async getInstructorAssignmentById(
    @Param() dto: GetInstructorActiveAssignmentById,
    @GetUser() user: User,
    @GetRealIp() ip: string,
  ) {
    dto.ip = ip;
    dto.user = user;
    const res = await this.assignmentService.getInstructorActiveAssignmentById(
      dto,
    );
    return res;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async getUserAssignmentById(
    @Param() dto: GetUserActiveAssignmentById,
    @GetUser() user: User,
    @GetRealIp() ip: string,
  ) {
    dto.ip = ip;
    dto.user = user;
    const res = await this.assignmentService.getUserActiveAssignmentById(dto);
    return res;
  }
}
