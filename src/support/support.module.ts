import { Module } from '@nestjs/common';

import { SupportService } from './support.service';
import { UploadModule } from '../upload/upload.module';
import { SupportController } from './support.controller';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  providers: [SupportService],
  controllers: [SupportController],
  imports: [RepositoryModule, UploadModule],
})
export class SupportModule {}
