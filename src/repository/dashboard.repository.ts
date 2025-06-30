import {
  TicketType,
  OrderStatus,
  TicketStatus,
  StoreOrderStatus,
} from '@prisma/client';
import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  DashboardStudentDto,
  DashboardInstructorDto,
} from '../dashbaord/dashboard.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class DashboardRepository {
  private exceptionMsg: string;
  private recentCommentLimit: number;
  private recentTicketLimit: number;
  private logger = new Logger('DashboardRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.recentCommentLimit = parseInt(
      this.configs.get('ADMIN_DASHBOARD_RECENT_BLOG_COMMENT_LIMIT'),
    );
    this.recentTicketLimit = parseInt(
      this.configs.get('ADMIN_DASHBOARD_RECENT_TICKET_LIMIT'),
    );
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async adminDashboardData(year?: number) {
    try {
      const [
        _totalSaleAndIncome,
        todayOrders,
        todayStoreOrders,
        newSupportTickets,
        newBlogComments,
        salesStatics,
      ] = await this.prisma.$transaction([
        this.prisma.order.aggregate({
          _sum: { amount: true },
          _count: { _all: true },
          where: { status: OrderStatus.Completed },
        }),
        this.prisma.order.count({
          where: {
            status: OrderStatus.Completed,
            createdAt: { gte: new Date(new Date().toDateString()) },
          },
        }),
        this.prisma.storeOrder.count({
          where: {
            createdAt: { gte: new Date(new Date().toDateString()) },
            status: {
              notIn: [StoreOrderStatus.Rejected, StoreOrderStatus.Refunded],
            },
          },
        }),
        this.prisma.ticket.findMany({
          select: {
            id: true,
            subject: true,
            user: {
              select: {
                id: true,
                username: true,
                createdAt: true,
                profileImage: true,
              },
            },
          },
          take: this.recentTicketLimit,
          where: {
            type: TicketType.Platform,
            status: TicketStatus.Opened,
            createdAt: { gte: new Date(new Date().toDateString()) },
          },
        }),
        this.prisma.blogComment.findMany({
          select: {
            id: true,
            blog: {
              select: { id: true, title: true },
            },
            comment: true,
            user: {
              select: {
                id: true,
                username: true,
                createdAt: true,
                profileImage: true,
              },
            },
          },
          take: this.recentTicketLimit,
          where: {
            createdAt: { gte: new Date(new Date().toDateString()) },
          },
        }),
        this.prisma.$queryRaw`
        SELECT 
        TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', o.created_at), 'month'))) AS "month",
        COUNT(*) AS sales 
        FROM "Order" o
        WHERE EXTRACT(YEAR FROM o.created_at)=${
          year ?? new Date().getFullYear()
        }
        GROUP BY TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', o.created_at), 'month')));`,
      ]);

      const totalSaleAndIncome = {
        totalSale: _totalSaleAndIncome._count._all ?? 0,
        totalIncome: _totalSaleAndIncome._sum.amount ?? 0,
      };

      return {
        ...totalSaleAndIncome,
        todayOrders,
        todayStoreOrders,
        newBlogComments,
        newSupportTickets,
        salesStatics,
      };
    } catch (err) {
      this.logger.error('failed to get admin dashboard data', err);
      this.logger.debug({ year });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async instructorDashboardData(dto: DashboardInstructorDto) {
    const { year, instructor } = dto;

    try {
      const [
        totalExpiredEnrollments,
        totalLifetimeEnrollments,
        totalExpiryEnrollments,
        newTickets,
        newReviews,
        enrollmentsStatics,
      ] = await this.prisma.$transaction([
        this.prisma.enrollment.count({
          where: {
            deleted: false,
            expiry: { lte: new Date() },
            course: {
              instructorId: instructor.id,
              // OR: [
              //   {
              //   },
              //   {
              //     associates: { some: { instructorId: instructor.id } },
              //   },
              // ],
            },
          },
        }),
        this.prisma.enrollment.count({
          where: {
            deleted: false,
            expiry: null,
            course: {
              instructorId: instructor.id,
              // OR: [
              //   {
              //   },
              //   {
              //     associates: { some: { instructorId: instructor.id } },
              //   },
              // ],
            },
          },
        }),
        this.prisma.enrollment.count({
          where: {
            deleted: false,
            expiry: { gte: new Date() },
            course: {
              instructorId: instructor.id,
              // OR: [
              //   {
              //   },
              //   {
              //     associates: { some: { instructorId: instructor.id } },
              //   },
              // ],
            },
          },
        }),
        this.prisma.ticket.count({
          where: {
            deleted: false,
            type: TicketType.Course,
            status: TicketStatus.Opened,
            createdAt: new Date(new Date().toDateString()),
            course: {
              instructorId: instructor.id,
              // OR: [
              //   {
              //    },
              //   { associates: { some: { instructorId: instructor.id } } },
              // ],
            },
          },
        }),
        this.prisma.review.count({
          where: {
            delete: false,
            createdAt: new Date(new Date().toDateString()),
            course: {
              instructorId: instructor.id,
              // OR: [
              //   { associates: { some: { instructorId: instructor.id } } },
              // ],
            },
          },
        }),
        this.prisma.$queryRaw`
        SELECT 
        TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', e.created_at), 'month'))) AS "month",
        COUNT(*) AS sales 
        FROM "Enrollment" e
        LEFT JOIN "Course" c ON c.id = e."courseId"
        LEFT JOIN "User" u ON u.id = c."instructorId"
        WHERE u.id = ${instructor.id} AND EXTRACT(YEAR FROM e.created_at)=${
          year ?? new Date().getFullYear()
        }
        GROUP BY TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', e.created_at), 'month')));`,
      ]);

      return {
        totalExpiryEnrollments,
        totalExpiredEnrollments,
        totalLifetimeEnrollments,
        newTickets,
        newReviews,
        enrollmentsStatics,
      };
    } catch (err) {
      this.logger.error('failed to get instructor dashboard data', err);
      this.logger.debug({ year, username: instructor.username });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async studentDashboardData(dto: DashboardStudentDto) {
    const { year, student } = dto;

    try {
      const [
        totalExpiredEnrollments,
        totalExpiryEnrollments,
        totalLifetimeEnrollments,
        newTickets,
        newThreadComments,
        enrollmentsStatics,
      ] = await this.prisma.$transaction([
        this.prisma.enrollment.count({
          where: {
            deleted: false,
            studentId: student.id,
            expiry: { lte: new Date() },
          },
        }),
        this.prisma.enrollment.count({
          where: {
            expiry: null,
            deleted: false,
            studentId: student.id,
          },
        }),
        this.prisma.enrollment.count({
          where: {
            deleted: false,
            studentId: student.id,
            expiry: { gte: new Date() },
          },
        }),
        this.prisma.ticket.count({
          where: {
            deleted: false,
            userId: student.id,
            type: TicketType.Course,
            status: TicketStatus.Opened,
            createdAt: new Date(new Date().toDateString()),
          },
        }),
        this.prisma.threadComment.count({
          where: {
            deleted: false,
            thread: { userId: student.id },
            createdAt: new Date(new Date().toDateString()),
          },
        }),
        this.prisma.$queryRaw`
        SELECT 
        TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', e.created_at), 'month'))) AS "month",
        COUNT(*) AS sales 
        FROM "Enrollment" e
        LEFT JOIN "User" u ON u.id = e."studentId"
        WHERE u.id = ${student.id} AND EXTRACT(YEAR FROM e.created_at)=${
          year ?? new Date().getFullYear()
        }
        GROUP BY TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', e.created_at), 'month')));`,
      ]);
      return {
        totalExpiryEnrollments,
        totalExpiredEnrollments,
        totalLifetimeEnrollments,
        newTickets,
        newThreadComments,
        enrollmentsStatics,
      };
    } catch (err) {
      this.logger.error('failed to get student dashboard data', err);
      this.logger.debug({ year, username: student.username });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
