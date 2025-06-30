import {
  Get,
  Post,
  Body,
  Query,
  Patch,
  UseGuards,
  Controller,
} from '@nestjs/common';
import {
  UpdateTicketDto,
  CreateTicketDto,
  ListUserTicketsDto,
  ListTicketCommentsDto,
  CreateTicketCommentDto,
  ListInstructorTicketsDto,
} from './support.dto';
import { User, UserRole } from '@prisma/client';

import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { SupportService } from './support.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Post('ticket')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async createTicket(@Body() dto: CreateTicketDto, @GetUser() user: User) {
    dto.user = user;
    const res = await this.supportService.createTicket(dto);
    return res;
  }

  @Get('ticket')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listTicket(@Query() dto: ListUserTicketsDto, @GetUser() user: User) {
    dto.user = user;
    const res = await this.supportService.listUserTickets(dto);
    return res;
  }

  @Patch('ticket')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async updateInstructorTicket(
    @Body() dto: UpdateTicketDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.supportService.updateInstructorTicket(dto);
    return res;
  }

  @Post('ticket/comment')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async createTicketComment(
    @Body() dto: CreateTicketCommentDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.supportService.createTicketComment(dto);
    return res;
  }

  @Get('ticket/comment')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listTicketComment(
    @Query() dto: ListTicketCommentsDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.supportService.listTicketComments(dto);
    return res;
  }

  @Get('ticket/instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listInstructorTicket(
    @Query() dto: ListInstructorTicketsDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.supportService.listInstructorTickets(dto);
    return res;
  }
}
