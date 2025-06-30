import { Module } from '@nestjs/common';

import { UploadModule } from '../upload/upload.module';
import { AssociatesService } from './associates.service';
import { AssociatesController } from './associates.controller';
import { RepositoryModule } from '../repository/repository.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  providers: [AssociatesService],
  controllers: [AssociatesController],
  imports: [RepositoryModule, UploadModule, NotificationsModule],
})
export class AssociateModule {}
