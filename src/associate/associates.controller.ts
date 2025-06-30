import { User, UserRole } from '@prisma/client';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import {
  InviteAssociateDto,
  ListAssociateInvitesDto,
  AcceptAssociateInviteDto,
  ListInstructorAssociatesDto,
} from './associates.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { AssociatesService } from './associates.service';

@Controller('associate')
export class AssociatesController {
  constructor(private associateService: AssociatesService) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async inviteAssociate(
    @Body() dto: InviteAssociateDto,
    @GetUser() courseOwner: User,
  ) {
    const res = await this.associateService.inviteAssociate(dto, courseOwner);
    return res;
  }

  @Get('invite')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listAssociateInvites(
    @Query() dto: ListAssociateInvitesDto,
    @GetUser() instructor: User,
  ) {
    const res = await this.associateService.listAssociateInvites(
      dto,
      instructor,
    );
    return res;
  }

  @Post('invite/accept')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async acceptAssociateInvite(
    @Body() dto: AcceptAssociateInviteDto,
    @GetUser() instructor: User,
  ) {
    const res = await this.associateService.acceptAssociateInvite(
      dto,
      instructor,
    );
    return res;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listInstructorAssociate(
    @Query() dto: ListInstructorAssociatesDto,
    @GetUser() instructor: User,
  ) {
    const res = await this.associateService.listInstructorAssociates(
      dto,
      instructor,
    );

    return res;
  }
}
