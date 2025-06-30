import { Module } from '@nestjs/common';

import { RewardPointsService } from './reward-points.service';
import { RepositoryModule } from '../repository/repository.module';
import { RewardPointsController } from './reward-points.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  exports: [RewardPointsService],
  providers: [RewardPointsService],
  controllers: [RewardPointsController],
  imports: [RepositoryModule, NotificationsModule],
})
export class RewardPointsModule {}
