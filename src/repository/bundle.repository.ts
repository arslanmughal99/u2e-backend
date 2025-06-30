import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Course, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import {
  CreateBundleDto,
  ListBundlesDto,
  UpdateBundleDto,
} from '../bundle/bundle.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class BundleRepository {
  private exceptionMsg: string;
  private logger = new Logger('BundleRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async createBundle(
    dto: Partial<CreateBundleDto> & { courses: Course[]; instructor: User },
  ) {
    const { courses, instructor, billingType, price, title } = dto;
    const _courses = courses.map((c) => ({ id: c.id }));

    try {
      const bundle = await this.prisma.bundle.create({
        data: {
          title,
          price,
          billingType,
          instructorId: instructor.id,
          courses: { connect: _courses },
        },
        include: {
          courses: { select: { id: true, title: true, thumbnail: true } },
        },
      });
      return bundle;
    } catch (err) {
      this.logger.error('failed to create bundle', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateBundle(
    dto: UpdateBundleDto & { courses?: Course[]; instructor: User },
  ) {
    const { id, courses, instructor, billingType, price, title } = dto;
    const _courses: {
      connect?: { id: number }[];
      disconnect?: { id: number }[];
    } = { connect: [], disconnect: [] };

    if (courses) {
      _courses.connect = courses.map((c) => ({ id: c.id }));

      try {
        const oldCourses = await this.prisma.bundle.findFirst({
          where: { id },
          select: { courses: { select: { id: true } } },
        });
        _courses.disconnect = oldCourses.courses;
      } catch (err) {
        this.logger.error('failed to get old bundle courses', err);
        throw new InternalServerErrorException(this.exceptionMsg);
      }
    }

    try {
      const bundle = await this.prisma.bundle.update({
        where: { id },
        data: {
          title,
          price,
          billingType,
          instructorId: instructor.id,
          courses: courses
            ? { disconnect: _courses.disconnect, connect: _courses.connect }
            : undefined,
        },
        include: {
          courses: { select: { id: true, title: true, thumbnail: true } },
        },
      });
      return bundle;
    } catch (err) {
      this.logger.error('failed to update bundle', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getBundleById(id: number) {
    try {
      const bundle = await this.prisma.bundle.findFirst({
        where: { id },
        include: {
          courses: { select: { id: true, title: true, thumbnail: true } },
        },
      });
      return bundle;
    } catch (err) {
      this.logger.error('failed to get bundle by id.', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async deleteBundle(id: number) {
    try {
      const deleted = await this.prisma.bundle.update({
        where: { id },
        data: { deleted: true },
      });
      return deleted.id;
    } catch (err) {
      this.logger.error('failed to delete bundle', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listBundles(dto: ListBundlesDto, instructor?: User) {
    const { page, size, billingType, search } = dto;
    let total: number;

    try {
      total = await this.prisma.bundle.count({
        where: {
          billingType,
          deleted: false,
          title: { contains: search, mode: 'insensitive' },
          instructorId: instructor ? instructor.id : undefined,
        },
      });
    } catch (err) {
      this.logger.error('failed to count list public bundle', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    try {
      const bundles = await this.prisma.bundle.findMany({
        where: {
          billingType,
          deleted: false,
          title: { contains: search, mode: 'insensitive' },
          instructorId: instructor ? instructor.id : undefined,
        },

        select: {
          id: true,
          price: true,
          title: true,
          billingType: true,
          courses: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              description: true,
            },
          },
          // instructor: {
          //   select: {
          //     fullname: true,
          //     profileImage: true,
          //     associates: {
          //       select: {
          //         instructor: {
          //           select: { fullname: true, profileImage: true },
          //         },
          //       },
          //     },
          //   },
          // },
        },
        take: size,
        skip: (page - 1) * size,
        orderBy: { id: 'desc' },
      });

      return { total, bundles };
    } catch (err) {
      this.logger.error('failed to list public bundle', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param ids bundles ids
   * @description Get courses bundles by ids
   */
  async getCoursesBundlesByIds(ids: number[]) {
    try {
      const bundles = await this.prisma.bundle.findMany({
        where: { id: { in: ids }, deleted: false },
        include: { courses: true },
      });
      return bundles;
    } catch (err) {
      this.logger.error('failed to get courses bundles by ids', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
