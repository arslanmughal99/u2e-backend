import { User, UserRole } from '@prisma/client';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { ListRewardPointsDto } from './reward-points.dto';
import { RewardPointsService } from './reward-points.service';

@Controller('reward-points')
export class RewardPointsController {
  constructor(private rewardPointsService: RewardPointsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listRewardPoints(
    @Query() dto: ListRewardPointsDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.rewardPointsService.listRewardPoints(dto);
    return res;
  }
}
