import { Module } from '@nestjs/common';

import { StoreService } from './store.service';
import { AuthModule } from '../auth/auth.module';
import { StoreController } from './store.controller';
import { UploadModule } from '../upload/upload.module';
import { RepositoryModule } from '../repository/repository.module';
import { RewardPointsModule } from '../reward-points/reward-points.module';

@Module({
  providers: [StoreService],
  controllers: [StoreController],
  imports: [RepositoryModule, UploadModule, AuthModule, RewardPointsModule],
})
export class StoreModule {}
