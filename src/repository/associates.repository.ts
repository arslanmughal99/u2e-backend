import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from './prisma.service';
import { ListInstructorAssociatesDto } from '../associate/associates.dto';

@Injectable()
export class AssociateRepository {
  private exceptionMsg: string;
  private logger = new Logger('AssociatesRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async listInstructorAssociates(
    dto: ListInstructorAssociatesDto,
    instructor: User,
  ) {
    const { page, size, search } = dto;

    try {
      // eslint-disable-next-line prefer-const
      let [total, associates] = await this.prisma.$transaction([
        this.prisma.associate.count({
          where: {
            course: { instructorId: instructor.id },
            OR: [
              {
                instructor: {
                  username: { contains: search, mode: 'insensitive' },
                },
              },
              { course: { title: { contains: search, mode: 'insensitive' } } },
            ],
          },
        }),

        this.prisma.associate.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { instructorId: 'desc' },
          where: { course: { instructorId: instructor.id } },
          select: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                createdAt: true,
                _count: { select: { lectures: true } },
              },
            },
            instructor: {
              select: {
                id: true,
                email: true,
                lastName: true,
                firstName: true,
                username: true,
                profileImage: true,
              },
            },
          },
        }),
      ]);

      (associates as any) = associates.map((a) => {
        (a as any).course.lectures = a.course._count.lectures;
        delete a.course._count;
        return a;
      });

      return { total, associates };
    } catch (err) {
      this.logger.error('failed to list associates', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
