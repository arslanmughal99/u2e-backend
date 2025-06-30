import { Module } from '@nestjs/common';

import { CourseService } from './course.service';
import { AuthModule } from '../auth/auth.module';
import { UploadModule } from '../upload/upload.module';
import { CourseController } from './course.controller';
import { RepositoryModule } from '../repository/repository.module';
import { RewardPointsModule } from '../reward-points/reward-points.module';

@Module({
  providers: [CourseService],
  controllers: [CourseController],
  imports: [RepositoryModule, UploadModule, AuthModule, RewardPointsModule],
})
export class CourseModule {}
