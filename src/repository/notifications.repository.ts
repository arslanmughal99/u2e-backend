import {
  User,
  Notificaiton,
  PrismaClient,
  NotificationScope,
} from '@prisma/client';
import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  RegisterNotificationDto,
  InstructorListSendNotificationsDto,
  UserListNotificationsDto,
} from '../notifications/notifications.dto';
import { RedisService } from './redis.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class NotificationsRepository {
  private exceptionMsg: string;
  private logger = new Logger('NotificationRepository');
  constructor(
    private redis: RedisService,
    private prisma: PrismaService,
    private configs: ConfigService,
  ) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async createNotification(args: {
    notification: Partial<Notificaiton> & { user: User };
    tx?: Omit<
      PrismaClient,
      '$on' | '$connect' | '$disconnect' | '$use' | '$transaction' | '$extends'
    >;
  }) {
    const { tx, notification } = args;
    const db = tx ? tx : this.prisma;
    const { title, message, courseId, userId, scope } = notification;
    try {
      const noti = await db.notificaiton.create({
        data: {
          scope,
          title,
          userId,
          message,
          courseId,
        },

        select: {
          scope: true,
          title: true,
          message: true,
          createdAt: true,
          course: { select: { id: true, title: true, thumbnail: true } },
        },
      });
      return noti;
    } catch (err) {
      this.logger.error('faield to create notification entry', err);
      delete (notification as any).user;
      this.logger.debug(notification);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async registerDevice(dto: RegisterNotificationDto) {
    const { token: id, user } = dto;
    try {
      await this.redis.instance.lpush(user.username, id);
    } catch (err) {
      this.logger.error('failed to register device', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getUserDevices(user: Partial<User>) {
    try {
      const devices = await this.redis.instance.lrange(user.username, 0, 500);
      return devices;
    } catch (err) {
      this.logger.error('faield to get user devices', err);
      this.logger.debug({ username: user.username });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async unregisterDevice(id: string, username: string) {
    try {
      await this.redis.instance.lrem(username, 0, id);
    } catch (err) {
      this.logger.error('failed to unregistered device', err);
      this.logger.debug({ username, deviceId: id });
    }
  }

  async getCourseUsersDevices(courseId: number) {
    const _students = await this.prisma.enrollment.findMany({
      where: {
        courseId,
        OR: [
          {
            expiry: null,
          },
          {
            expiry: { gte: new Date() },
          },
        ],
      },
      select: { student: { select: { username: true } } },
    });

    const students = _students.map((s) => s.student.username);

    const devices: { username: string; tokens: string[] }[] = [];
    for (const student of students) {
      const _devices = await this.redis.instance.lrange(student, 0, 500);
      if (_devices.length > 0)
        devices.push({ username: student, tokens: _devices });
    }

    return devices;
  }

  async listInstructorNotifications(dto: InstructorListSendNotificationsDto) {
    const { page, size, courseId, instructor } = dto;

    try {
      const [total, notifications] = await this.prisma.$transaction([
        this.prisma.notificaiton.count({
          where: {
            courseId,
            course: { instructorId: instructor.id },
          },
        }),
        this.prisma.notificaiton.findMany({
          take: size,
          orderBy: {
            id: 'desc',
          },
          skip: (page - 1) * size,
          select: {
            title: true,
            message: true,
            scope: true,
            createdAt: true,
            course: { select: { id: true, title: true, thumbnail: true } },
          },
          where: {
            courseId,
            deleted: false,
            scope: NotificationScope.Course,
            course: { instructorId: instructor.id },
          },
        }),
      ]);

      return { total, notifications };
    } catch (err) {
      this.logger.error('failed to list instructor notifications', err);
      delete dto.instructor;
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listUserNotifications(dto: UserListNotificationsDto) {
    const { page, size, user } = dto;

    try {
      const [total, notifications] = await this.prisma.$transaction([
        this.prisma.notificaiton.count({
          where: {
            deleted: false,
            OR: [
              { userId: user.id },
              { course: { enrollments: { some: { studentId: user.id } } } },
            ],
          },
        }),
        this.prisma.notificaiton.findMany({
          take: size,
          orderBy: {
            id: 'desc',
          },
          skip: (page - 1) * size,
          select: {
            scope: true,
            title: true,
            message: true,
            createdAt: true,
            course: { select: { id: true, title: true, thumbnail: true } },
          },
          where: {
            deleted: false,
            OR: [
              { userId: user.id },
              { course: { enrollments: { some: { studentId: user.id } } } },
            ],
          },
        }),
      ]);

      return { total, notifications };
    } catch (err) {
      this.logger.error('failed to list user notifications', err);
      delete dto.user;
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
