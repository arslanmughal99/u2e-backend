import {
  Logger,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, Prisma, PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import {
  ListEnrollmentsDto,
  GetEnrollmentAnalyticsDto,
  UpdateEnrollmentStatusDto,
} from '../enrollment/enrollment.dto';
import { PrismaService } from './prisma.service';
import { CreateEnrollment } from '../enrollment/enrollment.interface';

@Injectable()
export class EnrolledRepository {
  private exceptionMsg: string;
  private logger = new Logger('EnrolledRepository');

  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async createEnrollments(args: {
    tx?: Partial<PrismaClient>;
    enrollments: CreateEnrollment[];
  }) {
    const { tx, enrollments } = args;
    const db = tx ? tx : this.prisma;

    await db.enrollment.createMany({ data: enrollments });
  }

  // List enrollments for instructor
  async listEnrollments(dto: ListEnrollmentsDto, instructor: User) {
    const { page, size, to, from, courseId } = dto;
    const _to = new Date(new Date(to).setDate(new Date(to).getDate() + 1));

    let total: number;

    try {
      total = await this.prisma.enrollment.count({
        where: {
          course: {
            id: courseId,
            instructorId: instructor.id,
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
        },
      });
    } catch (err) {
      this.logger.error('failed to count enrollments', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    try {
      const enrollments = await this.prisma.enrollment.findMany({
        take: size,
        skip: (page - 1) * size,
        orderBy: { createdAt: 'desc' },
        select: {
          expiry: true,
          student: {
            select: {
              lastName: true,
              username: true,
              firstName: true,
              profileImage: true,
            },
          },
          course: { select: { id: true, title: true, thumbnail: true } },
        },
        where: {
          course: {
            id: courseId,
            instructorId: instructor.id,
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
        },
      });

      return { total, enrollments };
    } catch (err) {
      this.logger.error('failed to list enrollments', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  // Enrollments analyitcs
  async enrollmentsAnalytics(dto: GetEnrollmentAnalyticsDto, instructor: User) {
    const { year, courseId } = dto;

    const query = `SELECT 
    TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', ec.created_at), 'month'))) AS "month",
    COUNT(ec."courseId") AS enrollments 
    FROM "${Prisma.ModelName.Course}" c
    LEFT JOIN "${Prisma.ModelName.Enrollment}" ec ON c.id = ec."courseId"
    WHERE c."instructorId" = ${instructor.id} 
    ${year ? `AND EXTRACT(YEAR FROM ec.created_at)=${year}` : ''}
    ${courseId ? `AND c.id=${courseId}` : ''}
    GROUP BY TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', ec.created_at), 'month')))`;

    const analytics = await this.prisma.$queryRawUnsafe(query);

    return analytics;
  }

  // Get enrollement for student and by course
  async getEnrollmentByCourseAndStudent(courseId: number, studentId: number) {
    try {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { courseId, studentId, deleted: false },
      });

      return enrollment;
    } catch (err) {
      this.logger.error(
        'failed to get enrollment by courseId and studentId',
        err,
      );
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getEnrollmentsByCoursesAndStudent(
    studentId: number,
    courseIds: number[],
  ) {
    try {
      const enrollements = await this.prisma.enrollment.findMany({
        include: { course: true },
        where: { studentId, courseId: { in: courseIds } },
      });
      return enrollements;
    } catch (err) {
      this.logger.error(
        'failed to get enrollments by courses and student',
        err,
      );
      this.logger.debug({ studentId, courseIds });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getEnrollmentByLectureAndUser(lectureId: number, user: User) {
    try {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          course: { lectures: { some: { id: lectureId } } },
          studentId: user.id,
        },
      });

      return enrollment;
    } catch (err) {
      this.logger.error('failed to get enrollment by lecture and user', err);
      this.logger.debug({ userId: user.id, lectureId });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getStudentEnrollmentsStats(student: User) {
    const stats = await this.prisma.$queryRaw`SELECT
    CAST(SUM(CASE WHEN e.status = 'Active' THEN 1 ELSE 0 END) AS INTEGER) AS active,
    CAST(SUM(CASE WHEN e.status = 'Archived' THEN 1 ELSE 0 END) AS INTEGER) AS archived,
    CAST(SUM(CASE WHEN e.status = 'Completed' THEN 1 ELSE 0 END) AS INTEGER) AS completed
FROM
    "Enrollment" e WHERE e."studentId" = ${student.id};`;

    if ((stats as any).length <= 0) {
      throw new InternalServerErrorException('Something went wrong.');
    }

    return stats[0];
  }

  async updateStudentEnrollmentStatus(dto: UpdateEnrollmentStatusDto) {
    const { id, student, status } = dto;

    try {
      const enrollment = await this.prisma.enrollment.update({
        where: { id, studentId: student.id },
        data: { status },
        select: { id: true, status: true },
      });
      return enrollment;
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('Enrollment not found');
      }

      this.logger.error('failed to update student enrollment status', err);
      throw new InternalServerErrorException('Something went wrong');
    }
  }

  // async enrollFreeCourseInstant() {

  // }
}
