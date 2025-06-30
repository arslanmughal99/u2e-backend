import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationScope, User, UserRole } from '@prisma/client';

import {
  InviteAssociateDto,
  ListAssociateInvitesDto,
  AcceptAssociateInviteDto,
} from './associates.dto';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

import { UserRepository } from '../repository/user.repository';
import { CourseRepository } from '../repository/course.repository';
import { AssociateRepository } from '../repository/associates.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsRepository } from '../repository/notifications.repository';

@Injectable()
export class AssociatesService {
  constructor(
    private userRepository: UserRepository,
    private courseRepository: CourseRepository,
    private associateRepository: AssociateRepository,
    private notificaitonService: NotificationsService,
    private notificationRepository: NotificationsRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async inviteAssociate(dto: InviteAssociateDto, courseOwner: User) {
    const { courseId, associateUsername } = dto;
    const instructor = await this.userRepository.findUserByUsername(
      associateUsername,
    );

    if (!instructor || instructor.role !== UserRole.Instructor)
      throw new NotFoundException('Instructor not found.');

    const exist = await this.courseRepository.getAssociateInviteByCourseAndUser(
      courseId,
      instructor,
    );

    if (exist) throw new ConflictException('Invitation already exist.');

    const course = await this.courseRepository.getCourseById(
      courseId,
      courseOwner,
    );

    if (!course) throw new NotFoundException('Course not found');

    const invite = await this.courseRepository.createAssociateInvite({
      course,
      associate: instructor,
    });

    const noti = await this.notificationRepository.createNotification({
      notification: {
        // userId: instructor.id,
        user: instructor,
        scope: NotificationScope.Individual,
        title: 'Course association invite.',
        message: `${courseOwner.username} has invited you to become associate for course ${course.title}`,
      },
    });
    (noti as any).user = instructor;
    this.notificaitonService.sendUserNotification(noti as any);

    delete invite.courseId;
    delete invite.instructorId;

    return invite;
  }

  async listAssociateInvites(dto: ListAssociateInvitesDto, instructor: User) {
    const invites = await this.courseRepository.listAssociateInvites(
      dto,
      instructor,
    );

    return invites;
  }

  async acceptAssociateInvite(dto: AcceptAssociateInviteDto, instructor: User) {
    const { id } = dto;
    const invite = await this.courseRepository.getAssociateInviteByIdAndUser(
      id,
      instructor,
    );

    if (!invite) throw new NotFoundException('Invitation not found.');
    if (invite.accepted)
      throw new ConflictException('Invitation already excepted.');

    await this.courseRepository.updateAssociateInvite(invite, true);

    const associate = await this.courseRepository.createCourseAssociate(
      invite.courseId,
      instructor,
    );

    const noti = await this.notificationRepository.createNotification({
      notification: {
        // userId: instructor.id,
        user: instructor,
        scope: NotificationScope.Individual,
        title: 'Invitation accepted.',
        message: `${associate.instructor.username} has accepted invitation for course ${associate.course.title}`,
      },
    });
    (noti as any).user = instructor;
    this.notificaitonService.sendUserNotification(noti as any);

    return {
      accepted: true,
    };
  }

  async listInstructorAssociates(
    dto: ListAssociateInvitesDto,
    instructor: User,
  ) {
    const a = await this.associateRepository.listInstructorAssociates(
      dto,
      instructor,
    );

    a.associates = a.associates.map((associate) => {
      associate.course.thumbnail = this.uploadService.createCourseThumbnailLink(
        associate.course.thumbnail,
      );

      associate.instructor.profileImage =
        this.uploadService.createUserProfileLink(
          associate.instructor.profileImage,
        );

      return associate;
    });

    return a;
  }
}
