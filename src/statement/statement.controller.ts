import { User, UserRole } from '@prisma/client';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import {
  ListUserStatementsDto,
  GetStatementsAnalyticsDto,
  ListInstructorStatementsDto,
} from './statement.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { StatementService } from './statement.service';

@Controller('statement')
export class StatementController {
  constructor(private statementService: StatementService) {}

  @Get()
  @Roles(UserRole.Student)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async listUserStatements(
    @Query() dto: ListUserStatementsDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.statementService.listUserStatements(dto);
    return res;
  }

  @Get('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listInstructorStatements(
    @Query() dto: ListInstructorStatementsDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.statementService.listInstructorStatements(dto);
    return res;
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async getStatementsAnalytics(
    @Query() dto: GetStatementsAnalyticsDto,
    @GetUser() instructor: User,
  ) {
    const res = await this.statementService.getAnalytics(dto, instructor);
    return res;
  }
}
