import { UserRole } from '@prisma/client';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import {
  AdminUpdateRewardPointRuleDto,
  AdminSetRewardPointsExchangeRateDto,
} from './dto/reward-point.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminRewardPointService } from './reward-point.service';

@Controller('admin/reward-point')
@UseGuards(JwtAuthGuard, RoleGuard)
export class RewardPointController {
  constructor(private rewardPointService: AdminRewardPointService) {}

  @Get()
  @Roles(UserRole.Admin)
  async listRewardPointsRules() {
    const res = await this.rewardPointService.listRewardPointsRules();
    return res;
  }

  @Patch()
  @Roles(UserRole.Admin)
  async updateRewardPointsRule(@Body() dto: AdminUpdateRewardPointRuleDto) {
    const res = await this.rewardPointService.updateRewardRule(dto);
    return res;
  }

  @Patch('exchange-rate')
  @Roles(UserRole.Admin)
  async setExchangeRate(@Body() dto: AdminSetRewardPointsExchangeRateDto) {
    const res = await this.rewardPointService.setExchangeRate(dto);
    return res;
  }
}
