import {
  Logger,
  Injectable,
  RawBodyRequest,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request as RQ } from 'express';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, retry } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import { Order, Course, Product } from '@prisma/client';

import { PaymentMethodBase } from './payment.interface';

type YocoCreateChargeResp = {
  id: string;
  status: string;
  amount: number;
  paymentId: any;
  lineItems: any;
  externalId: any;
  successUrl: any;
  failureUrl: any;
  currency: string;
  cancelUrl: string;
  merchantId: string;
  totalDiscount: any;
  totalTaxAmount: any;
  subtotalAmount: any;
  redirectUrl: string;
  processingMode: string;
  metadata: {
    checkoutId: string;
    paymentFacilitator: string;
  };
};

enum YocoWebhookEventType {
  RefundFailed = 'refund.failed',
  RefundSuccess = 'refund.succeeded',
  PaymentSuccess = 'payment.succeeded',
}
type YocoWebhookEvent = {
  id: string;
  createdDate: string;
  type: YocoWebhookEventType;
  payload: {
    id: string;
    type: string;
    mode: string;
    status: string;
    amount: number;
    currency: string;
    createdDate: string;
    metadata: {
      checkoutId: string;
    };
  };
};

@Injectable()
export class YocoPaymentService
  implements
    PaymentMethodBase<
      { id: string; url: string; meta: any },
      { chargeId?: string; meta?: any }
    >
{
  private yocoSecret: string;
  private retryPayment: number;
  private exceptionMsg: string;
  private yocoWebhookScret: string;
  private logger = new Logger('YocoPaymentService');
  constructor(
    private configs: ConfigService,
    private httpService: HttpService,
  ) {
    this.yocoSecret = this.configs.get('YOCO_SECRET_KEY');
    this.yocoWebhookScret = this.configs.get('YOCO_WEBHOOK_SECRET');
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
    this.retryPayment = parseInt(this.configs.get('RETRY_PAYMENT_REQUEST'));
  }

  async createCharge(
    order: Partial<Order> & {
      courses: Course[];
      products: Product[];
    },
  ) {
    const { amount } = order;
    const idempotencyKey = randomUUID();

    try {
      const resp: AxiosResponse<YocoCreateChargeResp, YocoCreateChargeResp> =
        await firstValueFrom(
          this.httpService
            .post(
              'https://payments.yoco.com/api/checkouts',
              {
                currency: 'ZAR',
                amount: amount * 100,
                cancelUrl: 'https://yoco.com/',
              },
              {
                headers: {
                  'Idempotency-Key': idempotencyKey,
                  Authorization: `Bearer ${this.yocoSecret}`,
                },
              },
            )
            .pipe(retry(this.retryPayment)),
        );

      return {
        meta: resp.data,
        id: resp.data.id,
        url: resp.data.redirectUrl,
      };
    } catch (err) {
      if (err instanceof AxiosError) {
        this.logger.error('failed to charge payment', err.response.data);
        throw new NotFoundException('Failed to charge payment.');
      }

      this.logger.error('failed to handle payment charge request', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async approveCharge(req: RawBodyRequest<RQ>) {
    // const id = req.headers['webhook-id'];
    // const timestamp = req.headers['webhook-timestamp'];
    // const signedContent = `${id}.${timestamp}.${req.rawBody}`;
    // const secretBytes = Buffer.from(
    //   this.yocoWebhookScret.split('_')[1],
    //   'base64',
    // );
    // const signature = (req.headers['webhook-signature'] as string)
    //   .split(' ')[0]
    //   .split(',')[1];

    // const expectedSignature = createHmac('sha256', secretBytes)
    //   .update(signedContent)
    //   .digest('base64');

    // if (
    //   !timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
    // ) {
    //   throw new ForbiddenException('.');
    // }

    const {
      type: eventType,
      payload: { metadata },
    }: YocoWebhookEvent = req.body;

    if (eventType === YocoWebhookEventType.PaymentSuccess) {
      return { chargeId: metadata.checkoutId, meta: metadata };
    }

    return { chargeId: undefined, meta: undefined };
  }
}
