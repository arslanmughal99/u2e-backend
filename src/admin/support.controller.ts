import {
  Get,
  Body,
  Post,
  Param,
  Patch,
  Query,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

import {
  AdminListTicketsDto,
  AdminUpdateTicketDto,
  AdminGetTicketByIdDto,
  AdminListTicketCommentsDto,
  AdminCreateTicketCommentDto,
} from './dto/support.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetRealIp } from '../auth/get-ip.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { AdminSupportService } from './support.service';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, RoleGuard)
export class SupportController {
  constructor(private supportService: AdminSupportService) {}

  @Get('ticket')
  @Roles(UserRole.Admin)
  async listTickets(@Query() dto: AdminListTicketsDto) {
    const res = await this.supportService.listTickets(dto);
    return res;
  }

  @Get('ticket/comment')
  @Roles(UserRole.Admin)
  async listTicketsComments(
    @Query() dto: AdminListTicketCommentsDto,
    @GetRealIp() ip: string,
  ) {
    dto.ip = ip;
    const res = await this.supportService.listTicketComments(dto);
    return res;
  }

  @Post('ticket/comment')
  @Roles(UserRole.Admin)
  async createTicketComments(
    @Body() dto: AdminCreateTicketCommentDto,
    @GetUser() admin: User,
    @GetRealIp() ip: string,
  ) {
    dto.ip = ip;
    dto.user = admin;
    const res = await this.supportService.createPlatformTicketComment(dto);
    return res;
  }

  @Patch('ticket')
  @Roles(UserRole.Admin)
  async updateTickets(@Body() dto: AdminUpdateTicketDto) {
    const res = await this.supportService.updateTicket(dto);
    return res;
  }

  @Get('ticket/:id')
  @Roles(UserRole.Admin)
  async getTicketById(@Param() dto: AdminGetTicketByIdDto) {
    const res = await this.supportService.getTicketById(dto);
    return res;
  }
}
