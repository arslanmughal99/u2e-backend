import { Module } from '@nestjs/common';

import { DashbaordService } from './dashbaord.service';
import { DashbaordController } from './dashboard.controller';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  imports: [RepositoryModule],
  providers: [DashbaordService],
  controllers: [DashbaordController],
})
export class DashbaordModule {}
