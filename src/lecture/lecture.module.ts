import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { LectureService } from './lecture.service';
import { UploadModule } from '../upload/upload.module';
import { LectureController } from './lecture.controller';
import { RepositoryModule } from '../repository/repository.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  providers: [LectureService],
  controllers: [LectureController],
  imports: [RepositoryModule, UploadModule, AuthModule, NotificationsModule],
})
export class LectureModule {}
