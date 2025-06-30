import { Injectable } from '@nestjs/common';
import { NotificationScope, RewardPointsType, User } from '@prisma/client';

import {
  RewardPointsRepository,
  RewardPointsConditionKey,
} from '../repository/reward-points.repository';
import { ListRewardPointsDto } from './reward-points.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsRepository } from '../repository/notifications.repository';

@Injectable()
export class RewardPointsService {
  constructor(
    private notificationService: NotificationsService,
    private rewardPointsRepository: RewardPointsRepository,
    private notificationRepository: NotificationsRepository,
  ) {}

  async giveRewardPoints(
    user: Partial<User>,
    condition: RewardPointsConditionKey,
  ) {
    const _condition = await this.rewardPointsRepository.getCondition(
      condition,
    );
    if (_condition && _condition.active && _condition.points > 0) {
      const ok = await this.rewardPointsRepository.createRewardPoints({
        user,
        reason: _condition.title,
        points: _condition.points,
        type: RewardPointsType.Earn,
      });

      if (ok) {
        const noti = await this.notificationRepository.createNotification({
          notification: {
            // userId: user.id,
            user: user as any,
            scope: NotificationScope.Individual,
            title: 'You have earned reward points.',
            message: `You have earned ${_condition.points} for ${_condition.title}`,
          },
        });
        (noti as any).user = user;
        this.notificationService.sendUserNotification(noti as any);
      }
    }
  }

  // async reedeRewardPoints() {}

  async listRewardPoints(dto: ListRewardPointsDto) {
    const res = await this.rewardPointsRepository.listRewardPoints(dto);
    return res;
  }
}
