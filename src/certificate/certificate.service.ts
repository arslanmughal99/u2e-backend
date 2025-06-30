import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { NotificationScope } from '@prisma/client';

import {
  GetCertificateByIdDto,
  ListCertificatesDto,
  RequestCertificateDto,
} from './certificate.dto';
import { CourseRepository } from '../repository/course.repository';
import { LectureRepository } from '../repository/lecture.repository';
import { EnrolledRepository } from '../repository/enrolled.repository';
import { CertificateRepository } from '../repository/certificate.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsRepository } from '../repository/notifications.repository';
import { UPLOAD_SERVICE, UploadService } from '../upload/upload.port';

@Injectable()
export class CertificateService {
  constructor(
    private courseRepository: CourseRepository,
    private lectureRepository: LectureRepository,
    private enrollmentRepository: EnrolledRepository,
    private notificationService: NotificationsService,
    private certificateRepository: CertificateRepository,
    private notificationRepository: NotificationsRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async requestCertificate(dto: RequestCertificateDto) {
    const { user, courseId } = dto;
    const exist =
      await this.certificateRepository.getCertificateByUserAndCourse(
        user.id,
        courseId,
      );

    if (exist) throw new ConflictException('Certificate already issued.');

    const course = await this.courseRepository.getCourseById(courseId);

    if (!course) throw new NotFoundException('Course not found.');

    const enrollment =
      await this.enrollmentRepository.getEnrollmentByCourseAndStudent(
        courseId,
        user.id,
      );

    if (!enrollment)
      throw new NotFoundException('You are not enrolled in the course');

    const lastLecture = await this.lectureRepository.getLastLecture(course);

    if (!lastLecture) throw new NotFoundException('No progress found.');

    const progress = await this.lectureRepository.getLectureProgress(
      lastLecture,
      user,
    );

    if (!progress)
      throw new NotFoundException('You are not eligible for certificte');

    if (!progress.completed)
      throw new ForbiddenException('Please complete the course first.');

    const certificate = await this.certificateRepository.createCertificate(
      course,
      user,
    );

    const noti = await this.notificationRepository.createNotification({
      notification: {
        // userId: user.id,
        user: user,
        scope: NotificationScope.Individual,
        title: 'You got a new certificate',
        message: `Congratulations, You have received certificate for course ${course.title}`,
      },
    });
    (noti as any).user = user;
    this.notificationService.sendUserNotification(noti as any);

    return certificate;
  }

  async listCertificates(dto: ListCertificatesDto) {
    const c = await this.certificateRepository.listCertificates(dto);
    c.certificates = c.certificates.map((c) => {
      c.course.thumbnail = this.uploadService.createCourseThumbnailLink(
        c.course.thumbnail,
      );
      return c;
    });
    return c;
  }

  async getCertificateById(dto: GetCertificateByIdDto) {
    const { id } = dto;
    const certificate = await this.certificateRepository.getCertificateById(id);
    return certificate;
  }
}
