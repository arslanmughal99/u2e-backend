import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Order, Payment, PrismaClient, User } from '@prisma/client';

import { PrismaService } from './prisma.service';

@Injectable()
export class PaymentRepository {
  private exceptionMsg: string;
  private logger = new Logger('PaymentRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async createPayment(args: {
    meta: any;
    user: User;
    chargeId: string;
    tx?: PrismaClient;
    order: Partial<Order>;
  }) {
    const { tx, meta, user, order, chargeId } = args;
    const db = tx ? tx : this.prisma;

    const payment = await db.payment.create({
      data: {
        meta,
        chargeId,
        user: { connect: { id: user.id } },
        order: { connect: { id: order.id } },
      },
    });

    return payment;
  }

  async updatePayment(payment: Partial<Payment>) {
    const { id, executeMeta } = payment;
    try {
      const _payment = await this.prisma.payment.update({
        where: { id },
        data: { executeMeta },
      });
      return _payment;
    } catch (err) {
      this.logger.error('failed to update payment', err);
      this.logger.debug({ paymentId: payment.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getPaymentByChargeId(chargeId: string) {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: { chargeId },
        include: {
          user: true,
          order: { include: { courses: true, products: true } },
        },
      });
      return payment;
    } catch (err) {
      this.logger.error('failed to get payment by chargeId', err);
      this.logger.debug({ chargeId });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
