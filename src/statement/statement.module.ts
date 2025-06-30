import { Module } from '@nestjs/common';

import { StatementService } from './statement.service';
import { StatementController } from './statement.controller';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  imports: [RepositoryModule],
  providers: [StatementService],
  controllers: [StatementController],
})
export class StatementModule {}
