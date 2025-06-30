import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Course, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from './prisma.service';
import { ListCertificatesDto } from '../certificate/certificate.dto';

@Injectable()
export class CertificateRepository {
  private exceptionMsg: string;
  private logger = new Logger('CertificateRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async getCertificateByUserAndCourse(userId: number, courseId: number) {
    try {
      const certificate = await this.prisma.certificate.findFirst({
        where: { courseId, userId },
      });
      return certificate;
    } catch (err) {
      this.logger.error('failed to get certificate by user and course', err);
      this.logger.debug({ userId, courseId });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createCertificate(course: Partial<Course>, user: User) {
    try {
      const certificate = await this.prisma.certificate.create({
        data: { courseId: course.id, userId: user.id },
        select: {
          id: true,
          course: {
            select: {
              id: true,
              title: true,
              instructor: {
                select: { id: true, username: true },
              },
            },
          },
          user: {
            select: {
              id: true,
              lastName: true,
              createdAt: true,
              firstName: true,
              username: true,
            },
          },
        },
      });
      return certificate;
    } catch (err) {
      this.logger.error('failed to create certificate', err);
      this.logger.debug({ courseId: course.id, userId: user.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getCertificateById(id: string) {
    try {
      const certificate = await this.prisma.certificate.findFirst({
        where: { id },
        select: {
          id: true,
          course: {
            select: {
              id: true,
              title: true,
              instructor: {
                select: { id: true, username: true },
              },
            },
          },
          user: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              username: true,
            },
          },
        },
      });

      return certificate;
    } catch (err) {
      this.logger.error('failed to get certificate by id', err);
      this.logger.debug({ id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listCertificates(dto: ListCertificatesDto) {
    const { page, size, user, search } = dto;
    try {
      const [total, certificates] = await this.prisma.$transaction([
        this.prisma.certificate.count({
          where: {
            userId: user.id,
            course: { title: { contains: search }, deleted: false },
          },
        }),
        this.prisma.certificate.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            createdAt: true,
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                instructor: {
                  select: { id: true, username: true },
                },
              },
            },
          },
          where: {
            userId: user.id,
            course: { title: { contains: search }, deleted: false },
          },
        }),
      ]);

      return { total, certificates };
    } catch (err) {
      this.logger.error('failed to list certificates', err);
      delete dto.user;
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
