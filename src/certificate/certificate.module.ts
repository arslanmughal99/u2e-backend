import { Module } from '@nestjs/common';

import { UploadModule } from '../upload/upload.module';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { RepositoryModule } from '../repository/repository.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  providers: [CertificateService],
  controllers: [CertificateController],
  imports: [RepositoryModule, NotificationsModule, UploadModule],
})
export class CertificateModule {}
