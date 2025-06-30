import { Module } from '@nestjs/common';

import { PayoutService } from './payout.service';
import { PayoutController } from './payout.controller';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  providers: [PayoutService],
  imports: [RepositoryModule],
  controllers: [PayoutController],
})
export class PayoutModule {}
