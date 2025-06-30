import { Module } from '@nestjs/common';

import { BundleService } from './bundle.service';
import { BundleController } from './bundle.controller';
import { UploadModule } from '../upload/upload.module';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  imports: [RepositoryModule, UploadModule],
  providers: [BundleService],
  controllers: [BundleController],
})
export class BundleModule {}
