import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayoutAccount, PayoutStatus, Statement, User } from '@prisma/client';

import {
  ListPayoutDto,
  CreatePayoutAccountDto,
  UpdatePayoutAccountDto,
} from '../payout/payout.dto';
import {
  AdminListPayoutDto,
  AdminUpdatePayoutDto,
} from '../admin/dto/payout.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class PayoutRepository {
  private exceptionMsg: string;
  private logger = new Logger('PayoutRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async createPayoutAccount(dto: CreatePayoutAccountDto) {
    const {
      iban,
      bankName,
      currency,
      swiftCode,
      branchCode,
      instructor,
      accountNumber,
      accountHolderName,
    } = dto;

    try {
      const account = await this.prisma.payoutAccount.create({
        data: {
          iban,
          bankName,
          currency,
          swiftCode,
          branchCode,
          accountNumber,
          accountHolderName,
          userId: instructor.id,
        },
      });

      return account;
    } catch (err) {
      this.logger.error('failed to create payout account', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updatePayoutAccount(dto: UpdatePayoutAccountDto) {
    const {
      id,
      iban,
      bankName,
      currency,
      swiftCode,
      branchCode,
      accountNumber,
      accountHolderName,
    } = dto;

    try {
      const account = await this.prisma.payoutAccount.update({
        where: { id },
        data: {
          iban,
          bankName,
          currency,
          swiftCode,
          branchCode,
          accountNumber,
          accountHolderName,
        },
      });

      return account;
    } catch (err) {
      this.logger.error('failed to update payout account', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getPayoutAccount(instructor: User) {
    try {
      const account = await this.prisma.payoutAccount.findFirst({
        where: { userId: instructor.id },
      });

      return account;
    } catch (err) {
      this.logger.error('failed to get payout account', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getLastPayout(status: PayoutStatus, instructor: User) {
    try {
      const lastPayout = await this.prisma.payout.findFirst({
        include: { lastStatement: true },
        where: {
          status,
          userId: instructor.id,
        },
      });
      return lastPayout;
    } catch (err) {
      this.logger.error(
        `failed to get last payout for instructor ${instructor.username}`,
        err,
      );
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createPayout(
    args: {
      amount: number;
      lastStatement: Statement;
      payoutAccount: PayoutAccount;
    },
    instructor: User,
  ) {
    const { amount, lastStatement, payoutAccount } = args;

    try {
      const payout = await this.prisma.payout.create({
        data: {
          amount,
          userId: instructor.id,

          iban: payoutAccount.iban,
          currency: payoutAccount.currency,
          bankName: payoutAccount.bankName,
          swiftCode: payoutAccount.swiftCode,
          branchCode: payoutAccount.branchCode,
          accountNumber: payoutAccount.accountNumber,
          accountHolderName: payoutAccount.accountHolderName,

          lastStatementId: lastStatement.id,
        },
      });

      return payout;
    } catch (err) {
      this.logger.error('failed to create payout', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listPayouts(dto: ListPayoutDto, instructor: User) {
    const { page, size } = dto;

    try {
      const [total, payouts] = await this.prisma.$transaction([
        this.prisma.payout.count({ where: { userId: instructor.id } }),
        this.prisma.payout.findMany({
          select: {
            id: true,
            iban: true,
            trxId: true,
            amount: true,
            status: true,
            currency: true,
            bankName: true,
            createdAt: true,
            updatedAt: true,
          },
          take: size,
          orderBy: { id: 'desc' },
          skip: (page - 1) * size,
          where: { userId: instructor.id },
        }),
      ]);

      return { total, payouts };
    } catch (err) {
      this.logger.error('failed to list payout', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listPayoutsAdmin(dto: AdminListPayoutDto) {
    const { page, size, to, from, status } = dto;
    const _to = new Date(new Date(to).setDate(new Date(to).getDate() + 1));

    try {
      const [total, payouts] = await this.prisma.$transaction([
        this.prisma.payout.count({
          where: {
            status,
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
        }),
        this.prisma.payout.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            status,
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                lastName: true,
                firstName: true,
                profileImage: true,
              },
            },
          },
        }),
      ]);

      return { total, payouts };
    } catch (err) {
      this.logger.error('failed to list payouts for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getPayoutByIdAdmin(id: number) {
    try {
      const payout = await this.prisma.payout.findFirst({
        where: { id },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          iban: true,
          bankName: true,
          swiftCode: true,
          accountHolderName: true,
          accountNumber: true,
          branchCode: true,
          currency: true,
          trxId: true,
          user: {
            select: {
              id: true,
              username: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
      });
      return payout;
    } catch (err) {
      this.logger.error('failed to get payout by id for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updatePayoutAdmin(dto: AdminUpdatePayoutDto) {
    const { id, status, trxId } = dto;

    try {
      const payout = await this.prisma.payout.update({
        where: { id },
        data: { status, trxId },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          iban: true,
          bankName: true,
          swiftCode: true,
          accountHolderName: true,
          accountNumber: true,
          branchCode: true,
          currency: true,
          trxId: true,
          user: {
            select: {
              id: true,
              username: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
      });
      return payout;
    } catch (err) {
      this.logger.error('failed to update payout', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
