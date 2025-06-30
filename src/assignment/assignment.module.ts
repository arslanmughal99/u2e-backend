import { Module } from '@nestjs/common';

import { UploadModule } from '../upload/upload.module';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  providers: [AssignmentService],
  controllers: [AssignmentController],
  imports: [RepositoryModule, UploadModule],
})
export class AssignmentModule {}
