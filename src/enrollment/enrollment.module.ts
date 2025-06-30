import { Module } from '@nestjs/common';

import { UploadModule } from '../upload/upload.module';
import { EnrollmentService } from './enrollment.service';
import { PaymentModule } from '../payment/payment.module';
import { EnrollmentController } from './enrollment.controller';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  providers: [EnrollmentService],
  controllers: [EnrollmentController],
  imports: [RepositoryModule, UploadModule, PaymentModule],
})
export class EnrollmentModule {}
