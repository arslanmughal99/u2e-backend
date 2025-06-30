import { ConfigService } from '@nestjs/config';
import { Logger, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Course, Notificaiton, NotificationScope, User } from '@prisma/client';

import {
  RegisterNotificationDto,
  UserListNotificationsDto,
  InstructorCourseNotificationDto,
  InstructorListSendNotificationsDto,
} from './notifications.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { CourseRepository } from '../repository/course.repository';
import { UPLOAD_SERVICE, UploadService } from '../upload/upload.port';
import { NotificationsRepository } from '../repository/notifications.repository';

@Injectable()
export class NotificationsService {
  private exceptionMsg: string;
  private logger = new Logger('NotificationService');
  constructor(
    private configs: ConfigService,
    private firebase: FirebaseService,
    private courseRepository: CourseRepository,
    private notificationRepository: NotificationsRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async registerNotification(dto: RegisterNotificationDto) {
    const devices = await this.notificationRepository.getUserDevices(dto.user);
    if (devices.includes(dto.token)) return;
    await this.notificationRepository.registerDevice(dto);
  }

  async instructorCourseNotification(dto: InstructorCourseNotificationDto) {
    const { title, message, courseId, instructor } = dto;

    const exist = await this.courseRepository.getCourseById(courseId);
    if (!exist || exist.instructor.id !== instructor.id)
      throw new NotFoundException('Course not found.');

    const notification = await this.notificationRepository.createNotification({
      notification: {
        title,
        message,
        courseId,
        user: instructor,
        scope: NotificationScope.Course,
      },
    });

    this.sendCourseNotification(notification as any);

    if (notification.course.thumbnail)
      notification.course.thumbnail =
        this.uploadService.createCourseThumbnailLink(
          notification.course.thumbnail,
        );
    return notification;
  }

  async listInstructorSendNotifications(
    dto: InstructorListSendNotificationsDto,
  ) {
    if (dto.courseId) {
      const exist = await this.courseRepository.getCourseById(dto.courseId);
      if (!exist || exist.instructor.id !== dto.instructor.id)
        throw new NotFoundException('Course not found.');
    }

    const n = await this.notificationRepository.listInstructorNotifications(
      dto,
    );
    n.notifications = n.notifications.map((noti) => {
      noti.course.thumbnail = this.uploadService.createCourseThumbnailLink(
        noti.course.thumbnail,
      );
      return noti;
    });

    return n;
  }

  async listUserNotifications(dto: UserListNotificationsDto) {
    const n = await this.notificationRepository.listUserNotifications(dto);

    n.notifications = n.notifications.map((noti) => {
      if (noti.course)
        noti.course.thumbnail = this.uploadService.createCourseThumbnailLink(
          noti.course.thumbnail,
        );
      return noti;
    });

    return n;
  }

  async sendUserNotification(data: Notificaiton & { user: User }) {
    const user = data.user;
    const devices = await this.notificationRepository.getUserDevices(user);

    try {
      const res = await this.firebase.instance
        .messaging()
        .sendEachForMulticast({
          tokens: devices,
          notification: { title: data.title, body: data.message },
        });

      const unregisterDevices = [];
      res.responses.forEach((r, idx) => {
        if (
          !!r.error &&
          r.error.code === 'messaging/registration-token-not-registered'
        ) {
          unregisterDevices.push(res[idx]);
        }
      });

      if (unregisterDevices.length > 0)
        unregisterDevices.map((urd) =>
          this.notificationRepository.unregisterDevice(urd, user.username),
        );
    } catch (err) {
      this.logger.warn('failed to send user notification', err);
      this.logger.debug({ username: user.username, data });
      // throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  private async sendCourseNotification(
    data: Notificaiton & { course: Course },
  ) {
    const devices = await this.notificationRepository.getCourseUsersDevices(
      data.courseId,
    );

    for (const device of devices) {
      try {
        const res = await this.firebase.instance
          .messaging()
          .sendEachForMulticast({
            tokens: device.tokens,
            notification: { title: data.title, body: data.message },
          });

        const unregisterDevices = [];
        res.responses.forEach((r, idx) => {
          if (
            !!r.error &&
            r.error.code === 'messaging/registration-token-not-registered'
          ) {
            unregisterDevices.push(res[idx]);
          }
        });

        if (unregisterDevices.length > 0)
          unregisterDevices.map((urd) =>
            this.notificationRepository.unregisterDevice(urd, device.username),
          );
      } catch (err) {
        this.logger.warn('failed to send user notification', err);
        delete data.course;
        delete (data as any).user;
        this.logger.debug({ username: device.username, data });
      }
    }
  }

  // async sendUserNotification(user: Partial<User>, data: NotificationData) {
  //   const devices = await this.notificationRepository.getUserDevices(user);
  //   // const noti  = await this.notificationRepository.createNotification({})

  //   try {
  //     const res = await this.firebase.instance
  //       .messaging()
  //       .sendEachForMulticast({ tokens: devices, data });

  //     const unregisterDevices = [];
  //     res.responses.forEach((r, idx) => {
  //       if (
  //         !!r.error &&
  //         r.error.code === 'messaging/registration-token-not-registered'
  //       ) {
  //         unregisterDevices.push(res[idx]);
  //       }
  //     });

  //     if (unregisterDevices.length > 0)
  //       unregisterDevices.map((urd) =>
  //         this.notificationRepository.unregisterDevice(urd, user),
  //       );
  //   } catch (err) {
  //     this.logger.warn('failed to send user notification', err);
  //     this.logger.debug({ username: user.username, data });
  //     // throw new InternalServerErrorException(this.exceptionMsg);
  //   }
  // }
}
