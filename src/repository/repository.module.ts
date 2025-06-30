import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EtcdService } from './etcd.service';
import { RedisService } from './redis.service';
import { PrismaService } from './prisma.service';
import { BlogRepository } from './blog.repository';
import { UserRepository } from './user.repository';
import { StoreRepository } from './store.repository';
import { ForumRepository } from './forum.repository';
import { OrderRepository } from './order.repository';
import { TicketRepository } from './ticket.repository';
import { PayoutRepository } from './payout.repository';
import { CourseRepository } from './course.repository';
import { BundleRepository } from './bundle.repository';
import { LectureRepository } from './lecture.repository';
import { PaymentRepository } from './payment.repository';
import { MeetingRepository } from './meeting.repository';
import { CategoryRepository } from './category.repository';
import { EnrolledRepository } from './enrolled.repository';
import { StatementRepository } from './statement.repository';
import { DashboardRepository } from './dashboard.repository';
import { AssociateRepository } from './associates.repository';
import { AssignmentRepository } from './assignment.repository';
import { CertificateRepository } from './certificate.repository';
import { OrganizationRepository } from './organization.repository';
import { RewardPointsRepository } from './reward-points.repository';
import { NotificationsRepository } from './notifications.repository';

@Module({
  imports: [ConfigModule],
  exports: [
    UserRepository,
    BlogRepository,
    StoreRepository,
    ForumRepository,
    OrderRepository,
    CourseRepository,
    BundleRepository,
    PayoutRepository,
    TicketRepository,
    PaymentRepository,
    LectureRepository,
    MeetingRepository,
    EnrolledRepository,
    CategoryRepository,
    DashboardRepository,
    StatementRepository,
    AssociateRepository,
    AssignmentRepository,
    CertificateRepository,
    RewardPointsRepository,
    OrganizationRepository,
    NotificationsRepository,
  ],
  providers: [
    EtcdService,
    RedisService,
    PrismaService,
    UserRepository,
    BlogRepository,
    ForumRepository,
    StoreRepository,
    OrderRepository,
    CourseRepository,
    PayoutRepository,
    TicketRepository,
    BundleRepository,
    PaymentRepository,
    LectureRepository,
    MeetingRepository,
    EnrolledRepository,
    CategoryRepository,
    DashboardRepository,
    StatementRepository,
    AssociateRepository,
    DashboardRepository,
    AssignmentRepository,
    CertificateRepository,
    OrganizationRepository,
    RewardPointsRepository,
    NotificationsRepository,
  ],
})
export class RepositoryModule {}
