import { Module } from '@nestjs/common';

import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { UploadModule } from '../upload/upload.module';
import { PrismaService } from '../repository/prisma.service';
import { RepositoryModule } from '../repository/repository.module';
import { RewardPointsModule } from '../reward-points/reward-points.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  exports: [OrderService],
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
  imports: [
    UploadModule,
    RepositoryModule,
    NotificationsModule,
    RewardPointsModule,
  ],
})
export class OrderModule {}
