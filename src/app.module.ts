import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import errors, { ERROR_CODES_TOKEN } from './errors';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BlogModule } from './blog/blog.module';
import { UserModule } from './user/user.module';
import { QuizModule } from './quiz/quiz.module';
import { AppController } from './app.controller';
import { StoreModule } from './store/store.module';
import { OrderModule } from './order/order.module';
import { ForumModule } from './forum/forum.module';
import { AdminModule } from './admin/admin.module';
import { PayoutModule } from './payout/payout.module';
import { CourseModule } from './course/course.module';
import { UploadModule } from './upload/upload.module';
import { BundleModule } from './bundle/bundle.module';
import { LectureModule } from './lecture/lecture.module';
import { PaymentModule } from './payment/payment.module';
import { SupportModule } from './support/support.module';
import { MeetingModule } from './meeting/meeting.module';
import { FirebaseModule } from './firebase/firebase.module';
import { StatementModule } from './statement/statement.module';
import { AssociateModule } from './associate/associate.module';
import { DashbaordModule } from './dashbaord/dashbaord.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { RepositoryModule } from './repository/repository.module';
import { AssignmentModule } from './assignment/assignment.module';
import { CertificateModule } from './certificate/certificate.module';
import { OrganizationModule } from './organization/organization.module';
import { RewardPointsModule } from './reward-points/reward-points.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    AuthModule,
    UserModule,
    ForumModule,
    QuizModule,
    BlogModule,
    StoreModule,
    OrderModule,
    AdminModule,
    CourseModule,
    BundleModule,
    UploadModule,
    PayoutModule,
    PaymentModule,
    LectureModule,
    MeetingModule,
    SupportModule,
    FirebaseModule,
    AssociateModule,
    DashbaordModule,
    StatementModule,
    EnrollmentModule,
    AssignmentModule,
    RepositoryModule,
    CertificateModule,
    RewardPointsModule,
    OrganizationModule,
    NotificationsModule,
  ],
  providers: [{ provide: ERROR_CODES_TOKEN, useValue: errors }, AppService],
  controllers: [AppController],
})
export class AppModule {}
