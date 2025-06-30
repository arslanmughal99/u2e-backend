import { Module } from '@nestjs/common';

import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { UploadModule } from '../upload/upload.module';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  providers: [BlogService],
  controllers: [BlogController],
  imports: [UploadModule, RepositoryModule],
})
export class BlogModule {}
