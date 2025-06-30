import { Inject, Injectable } from '@nestjs/common';

import { AdminGetDashboardDto } from './dto/dashboard.dto';
import { UPLOAD_SERVICE, UploadService } from '../upload/upload.port';
import { DashboardRepository } from '../repository/dashboard.repository';

@Injectable()
export class AdminDashboardService {
  constructor(
    private dashbaordRepository: DashboardRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async getAdminDashboardData(dto: AdminGetDashboardDto) {
    const { year } = dto;
    const data = await this.dashbaordRepository.adminDashboardData(year);

    data.newSupportTickets = data.newSupportTickets.map((t) => {
      if (t.user.profileImage)
        t.user.profileImage = this.uploadService.createUserProfileLink(
          t.user.profileImage,
        );
      return t;
    });

    data.newBlogComments = data.newBlogComments.map((b) => {
      if (b.user.profileImage)
        b.user.profileImage = this.uploadService.createUserProfileLink(
          b.user.profileImage,
        );
      return b;
    });
    return data;
  }
}
