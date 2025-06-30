import {
  Logger,
  Injectable,
  RawBodyRequest,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Request as RQ } from 'express';
import { NotificationScope, OrderStatus, PaymentMethod } from '@prisma/client';

import { PayOrderDto } from './payment.dto';
import { YocoPaymentService } from './yoco.service';
import { OrderService } from '../order/order.service';
import { UserRepository } from '../repository/user.repository';
import { OrderRepository } from '../repository/order.repository';
import { PaymentRepository } from '../repository/payment.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsRepository } from '../repository/notifications.repository';

@Injectable()
export class PaymentService {
  private logger = new Logger('PaymentService');
  constructor(
    private orderService: OrderService,
    private userRepository: UserRepository,
    private orderRepository: OrderRepository,
    private paymentRepository: PaymentRepository,
    private yocoPaymentService: YocoPaymentService,
    private notificationService: NotificationsService,
    private notificationRepository: NotificationsRepository,
  ) {}

  async createCharge(dto: PayOrderDto) {
    const method = dto.method ? dto.method : PaymentMethod.Yoco;
    const order = await this.orderRepository.getOrderById(dto.orderId);

    if (!order || order.user.id !== dto.user.id)
      throw new NotFoundException('Order not found.');

    switch (order.status) {
      case OrderStatus.Completed:
        throw new NotFoundException('Order already completed.');
      case OrderStatus.Expired:
        throw new NotFoundException('Order is expired.');
    }

    switch (method) {
      case PaymentMethod.Yoco:
        const { id, url, meta } = await this.yocoPaymentService.createCharge(
          order,
        );
        await this.paymentRepository.createPayment({
          meta,
          order,
          chargeId: id,
          user: dto.user,
        });
        return { url };
      default:
        throw new NotFoundException('Payment method not found.');
    }
  }

  async approveOrder(req: RawBodyRequest<RQ>, method: PaymentMethod) {
    let approvePayment: { chargeId?: string; meta?: any };
    switch (method) {
      case PaymentMethod.Yoco:
        approvePayment = await this.yocoPaymentService.approveCharge(req);
      default:
        approvePayment = await this.yocoPaymentService.approveCharge(req);
    }

    const { meta, chargeId } = approvePayment;

    if (!chargeId) return;
    const payment = await this.paymentRepository.getPaymentByChargeId(chargeId);
    if (!payment) throw new NotFoundException('Payment not found.');

    const order = payment.order;
    if (order.status === OrderStatus.Expired)
      throw new ConflictException('Order expired.');
    if (order.executed || order.status === OrderStatus.Completed)
      throw new ConflictException('Order already fulfilled.');
    await this.orderService.executeOrder(order, payment.id);

    const user = await this.userRepository.findUserById(order.userId);
    if (!user) return;

    const noti = await this.notificationRepository.createNotification({
      notification: {
        // userId: user.id,
        user,
        scope: NotificationScope.Individual,
        title: 'Payment successful.',
        message: `Thank you for your order, Your payment for order ${order.id} completed.`,
      },
    });
    (noti as any).user = user;
    this.notificationService.sendUserNotification(noti as any);

    payment.executeMeta = meta;
    await this.paymentRepository.updatePayment(payment);
  }
}
