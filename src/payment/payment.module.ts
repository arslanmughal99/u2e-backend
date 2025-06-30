import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { PaymentService } from './payment.service';
import { YocoPaymentService } from './yoco.service';
import { OrderModule } from '../order/order.module';
import { PaymentController } from './payment.controller';
import { RepositoryModule } from '../repository/repository.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  exports: [PaymentService],
  controllers: [PaymentController],
  providers: [PaymentService, YocoPaymentService],
  imports: [RepositoryModule, HttpModule, OrderModule, NotificationsModule],
})
export class PaymentModule {}
