import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

import { UploadModule } from '../upload/upload.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  exports: [NotificationsService],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  imports: [FirebaseModule, RepositoryModule, UploadModule],
})
export class NotificationsModule {}
