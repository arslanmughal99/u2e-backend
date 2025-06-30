import { User, UserRole } from '@prisma/client';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PayoutService } from './payout.service';
import { GetUser } from '../auth/get-user.decorator';
import { CreatePayoutAccountDto, ListPayoutDto } from './payout.dto';

@Controller('payout')
export class PayoutController {
  constructor(private payoutService: PayoutService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listPayouts(@Query() dto: ListPayoutDto, @GetUser() instructor: User) {
    const res = await this.payoutService.listPayouts(dto, instructor);
    return res;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async createPayout(@GetUser() instructor: User) {
    const res = await this.payoutService.createPayout(instructor);
    return res;
  }

  @Post('account')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async createPayoutAccount(
    @Body() dto: CreatePayoutAccountDto,
    @GetUser() instructor: User,
  ) {
    dto.instructor = instructor;
    const res = await this.payoutService.createPayoutAccount(dto);
    return res;
  }

  @Get('account')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async getPayoutAccount(@GetUser() instructor: User) {
    const res = await this.payoutService.getPayoutAccount(instructor);
    return res;
  }
}
