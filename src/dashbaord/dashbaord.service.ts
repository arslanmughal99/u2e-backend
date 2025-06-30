import { Injectable } from '@nestjs/common';

import { DashboardRepository } from '../repository/dashboard.repository';
import { DashboardInstructorDto, DashboardStudentDto } from './dashboard.dto';

@Injectable()
export class DashbaordService {
  constructor(private dashboardRepository: DashboardRepository) {}

  async getInstructorDashboardData(dto: DashboardInstructorDto) {
    const data = await this.dashboardRepository.instructorDashboardData(dto);

    return data;
  }

  async getStudentDashboardData(dto: DashboardStudentDto) {
    const data = await this.dashboardRepository.studentDashboardData(dto);

    return data;
  }
}
