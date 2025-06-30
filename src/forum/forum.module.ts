import { Module } from '@nestjs/common';

import { ForumService } from './forum.service';
import { AuthModule } from '../auth/auth.module';
import { ForumController } from './forum.controller';
import { UploadModule } from '../upload/upload.module';
import { RepositoryModule } from '../repository/repository.module';
import { RewardPointsModule } from '../reward-points/reward-points.module';

@Module({
  providers: [ForumService],
  controllers: [ForumController],
  imports: [RepositoryModule, UploadModule, AuthModule, RewardPointsModule],
})
export class ForumModule {}
