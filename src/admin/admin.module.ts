import { Module } from '@nestjs/common';

import { AdminBlogService } from './blog.service';
import { AdminUserService } from './user.service';
import { UserController } from './user.controller';
import { BlogController } from './blog.controller';
import { AdminStoreService } from './store.service';
import { StoreController } from './store.controller';
import { AdminPayoutService } from './payout.service';
import { UploadModule } from '../upload/upload.module';
import { AdminCourseService } from './course.service';
import { PayoutController } from './payout.controller';
import { CourseController } from './course.controller';
import { AdminSupportService } from './support.service';
// import { AdminOrgService } from './organization.service';
import { SupportController } from './support.controller';
import { AdminCategoryService } from './category.service';
// import { OrgController } from './organization.controller';
import { CategoryController } from './category.controller';
import { AdminDashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AdminRewardPointService } from './reward-point.service';
import { RewardPointController } from './reward-point.controller';
import { RepositoryModule } from '../repository/repository.module';

@Module({
  providers: [
    // AdminOrgService,
    AdminUserService,
    AdminBlogService,
    AdminStoreService,
    AdminPayoutService,
    AdminCourseService,
    AdminSupportService,
    AdminCategoryService,
    AdminDashboardService,
    AdminDashboardService,
    AdminRewardPointService,
  ],
  controllers: [
    // OrgController,
    BlogController,
    UserController,
    StoreController,
    CourseController,
    PayoutController,
    SupportController,
    CategoryController,
    DashboardController,
    RewardPointController,
  ],
  imports: [RepositoryModule, UploadModule],
})
export class AdminModule {}
