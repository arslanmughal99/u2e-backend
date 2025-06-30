import { User } from '@prisma/client';
import { Logger, Injectable, Inject } from '@nestjs/common';

import {
  ListEnrollmentsDto,
  GetEnrollmentAnalyticsDto,
  UpdateEnrollmentStatusDto,
  EnrollFreeInstantDto,
} from './enrollment.dto';
import { UPLOAD_SERVICE, UploadService } from '../upload/upload.port';
import { EnrolledRepository } from '../repository/enrolled.repository';

@Injectable()
export class EnrollmentService {
  private logger = new Logger('EnrollmentService');
  constructor(
    private enrollmentRepository: EnrolledRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  // list enrollments for instructor
  async listEnrollments(dto: ListEnrollmentsDto, ip: string, instructor: User) {
    const e = await this.enrollmentRepository.listEnrollments(dto, instructor);

    e.enrollments = e.enrollments.map((en) => {
      en.course.thumbnail = this.uploadService.createCourseThumbnailLink(
        en.course.thumbnail,
      );

      en.student.profileImage = this.uploadService.createUserProfileLink(
        en.student.profileImage,
      );

      return en;
    });

    return e;
  }

  async updateEnrollmentStatus(dto: UpdateEnrollmentStatusDto) {
    const s = await this.enrollmentRepository.updateStudentEnrollmentStatus(
      dto,
    );
    return s;
  }

  async getStudentEnrollmentsStats(user: User) {
    const stats = await this.enrollmentRepository.getStudentEnrollmentsStats(
      user,
    );
    return stats;
  }

  // get enrollments analytics for instructor
  async getEnrollmentsAnalytics(
    dto: GetEnrollmentAnalyticsDto,
    instructor: User,
  ) {
    const analytics = await this.enrollmentRepository.enrollmentsAnalytics(
      dto,
      instructor,
    );
    return { analytics };
  }

  // async enrollFreeCoursesInstant(dto: EnrollFreeInstantDto) {
  //   const { user } = dto;
  // }
}
