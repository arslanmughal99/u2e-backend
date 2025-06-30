import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, User } from '@prisma/client';

import {
  ListInstructorStatementsDto,
  GetStatementsAnalyticsDto,
  ListUserStatementsDto,
} from '../statement/statement.dto';
import { PrismaService } from './prisma.service';
import { CreateStatement } from '../statement/statement.interface';

@Injectable()
export class StatementRepository {
  private exceptionMsg: string;
  private logger = new Logger('StatementRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async listInstructorStatements(dto: ListInstructorStatementsDto) {
    const { to, from, page, size, instructor } = dto;
    const _to = new Date(new Date(to).setDate(new Date(to).getDate() + 1));

    try {
      const [total, statements] = await this.prisma.$transaction([
        this.prisma.statement.count({
          where: {
            OR: [
              { course: { instructorId: instructor.id } },
              { bundle: { instructorId: instructor.id } },
            ],
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
        }),
        this.prisma.statement.findMany({
          select: {
            id: true,
            amount: true,
            createdAt: true,
            user: { select: { lastName: true, firstName: true } },
            bundle: { select: { title: true, id: true } },
            course: { select: { title: true, id: true } },
            product: { select: { id: true, title: true } },
            payouts: {
              orderBy: { id: 'desc' },
              select: { id: true, amount: true, status: true },
            },
          },
          where: {
            OR: [
              { course: { instructorId: instructor.id } },
              { bundle: { instructorId: instructor.id } },
            ],
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
        }),
      ]);

      return { total, statements };
    } catch (err) {
      this.logger.error('failed to list statements', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listUserStatements(dto: ListUserStatementsDto) {
    const { to, from, page, size, user } = dto;
    const _to = new Date(new Date(to).setDate(new Date(to).getDate() + 1));

    try {
      const [total, statements] = await this.prisma.$transaction([
        this.prisma.statement.count({
          where: {
            userId: user.id,
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
        }),
        this.prisma.statement.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            userId: user.id,
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
          select: {
            id: true,
            amount: true,
            createdAt: true,
            product: { select: { id: true, title: true } },
            bundle: { select: { title: true, id: true } },
            course: { select: { title: true, id: true } },
            payouts: {
              orderBy: { id: 'desc' },
              select: { id: true, amount: true, status: true },
            },
          },
        }),
      ]);

      return { total, statements };
    } catch (err) {
      this.logger.error('failed to list statements', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getAnalytics(dto: GetStatementsAnalyticsDto, instructor: User) {
    const { year } = dto;

    const analytics = await this.prisma.$queryRaw`
    SELECT 
    TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', s.created_at), 'month'))) AS "month",
    SUM(s.amount) AS amount 
    FROM "Statement" s
    LEFT JOIN "Course" c ON s."courseId" = c.id
    LEFT JOIN "Bundle" b ON s."bundleId" = b.id
    LEFT JOIN "Product" p ON s."productId" = p.id
    WHERE 
    (c."instructorId" = ${instructor.id} OR b."instructorId" = ${instructor.id})
    AND EXTRACT(YEAR FROM s.created_at)=${year || new Date().getFullYear()}
    GROUP BY TRIM(BOTH FROM INITCAP(TO_CHAR(DATE_TRUNC('month', s.created_at), 'month')))`;

    return { analytics };
  }

  async getCalculatedPayoutWithLastStatement(
    lastStatementId: number,
    instructor: User,
  ) {
    try {
      const [sum, lastStatement] = await this.prisma.$transaction([
        this.prisma.statement.aggregate({
          _sum: { amount: true },
          where: {
            id: { gt: lastStatementId },
            OR: [
              {
                bundle: { instructorId: instructor.id },
              },
              {
                course: { instructorId: instructor.id },
              },
            ],
          },
        }),
        this.prisma.statement.findFirst({
          orderBy: { id: 'desc' },
          where: {
            OR: [
              {
                bundle: { instructorId: instructor.id },
              },
              {
                course: { instructorId: instructor.id },
              },
            ],
          },
        }),
      ]);

      return { amount: sum._sum.amount, lastStatement };
    } catch (err) {
      this.logger.error(
        'failed to get calculated payout with last payment',
        err,
      );
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createStatements(args: {
    tx?: Partial<PrismaClient>;
    statements: CreateStatement[];
  }) {
    const { tx, statements } = args;
    const db = tx ? tx : this.prisma;

    await db.statement.createMany({ data: statements });
  }
}
