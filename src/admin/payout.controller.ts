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
  AdminListPayoutDto,
  AdminUpdatePayoutDto,
  AdminGetPayoutByIdDto,
} from './dto/payout.dto';
import { RoleGuard } from '../auth/role.guard';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminPayoutService } from './payout.service';

@Controller('admin/payout')
@UseGuards(JwtAuthGuard, RoleGuard)
export class PayoutController {
  constructor(private payoutService: AdminPayoutService) {}

  @Get()
  @Roles(UserRole.Admin)
  async listPayouts(@Query() dto: AdminListPayoutDto) {
    const res = await this.payoutService.listPayoutServices(dto);
    return res;
  }

  @Patch()
  @Roles(UserRole.Admin)
  async updatePayouts(@Body() dto: AdminUpdatePayoutDto) {
    const res = await this.payoutService.updatePayout(dto);
    return res;
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  async getPayoutById(@Param() dto: AdminGetPayoutByIdDto) {
    const res = await this.payoutService.getPayoutById(dto);
    return res;
  }
}
