import {
  User,
  Order,
  Coupon,
  Course,
  Product,
  OrderStatus,
  PrismaClient,
} from '@prisma/client';
import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { groupBy, omitBy, reduce, round } from 'lodash';

import { PrismaService } from './prisma.service';
import { ListOrdersDto } from '../order/order.dto';
import { OrderMeta } from '../order/order.interface';

@Injectable()
export class OrderRepository {
  private exceptionMsg: string;
  private logger = new Logger('OrderRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async createOrder(args: {
    user: User;
    coupon?: Coupon;
    meta: OrderMeta;
    courses: Course[];
    products: Product[];
    tx?: Omit<
      PrismaClient,
      '$on' | '$connect' | '$disconnect' | '$use' | '$transaction' | '$extends'
    >;
  }) {
    const { tx, meta, user, coupon, products, courses } = args;
    const db = tx ? tx : this.prisma;

    const bundlesMeta = omitBy(
      groupBy(meta.courses, 'bundleId'),
      (v, k) => k === 'undefined',
    );

    const coursesMeta = meta.courses.filter((c) => !c.bundleId);

    // Calc bundle cost from meta
    const bundlesCost = round(
      reduce(
        bundlesMeta,
        (sum, v) => {
          const bundlePrice = v[0].bundlePrice;
          sum += v[0].months ? v[0].months * bundlePrice : bundlePrice;
          return sum;
        },
        0,
      ),
      2,
    );

    // Calc courses cost from meta
    const coursesCost = round(
      coursesMeta.reduce((sum, v) => {
        const price = v.discountedPrice ? v.discountedPrice : v.price;
        sum += v.months ? v.months * price : price;
        return sum;
      }, 0),
      2,
    );

    // Calc products cost from meta
    const productsCost = round(
      meta.products.reduce((sum, v) => {
        const price = v.discountedPrice ? v.discountedPrice : v.price;
        sum += price;
        return sum;
      }, 0),
      2,
    );

    const amount = round(bundlesCost + coursesCost + productsCost, 2);

    const cids = courses.map((c) => ({ id: c.id }));
    const pids = products.map((p) => ({ id: p.id }));

    try {
      const order = await db.order.create({
        data: {
          meta,
          amount,
          userId: user.id,
          courses: { connect: cids },
          products: { connect: pids },
          status: OrderStatus.Pending,
          couponId: coupon ? coupon.id : undefined,
        },
        include: { courses: true, products: true },
        // select: {
        //   id: true,
        //   amount: true,
        //   courses: { select: { id: true, title: true } },
        //   products: { select: { id: true, title: true } },
        //   // coupon: {
        //   //   select: {
        //   //     scope: true,
        //   //     operator: true,
        //   //     discount: true,
        //   //     products: { select: { id: true, title: true } },
        //   //     courses: { select: { id: true, title: true } },
        //   //     categories: { select: { id: true, title: true } },
        //   //   },
        //   // },
        // },
      });

      return order;
    } catch (err) {
      this.logger.error('failed to create order', err);
      this.logger.debug({ user: user.username, coupon, products });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateOrder(args: {
    order: Partial<Order>;
    tx?: Partial<PrismaClient>;
  }) {
    const { tx, order } = args;
    const { id, executed, status } = order;
    const db = tx ? tx : this.prisma;

    try {
      await db.order.update({
        where: { id, deleted: false },
        data: { status, executed },
      });
    } catch (err) {
      this.logger.error('failed to update order', err);
      this.logger.debug({ orderId: id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listOrders(dto: ListOrdersDto) {
    const { page, size, user, status } = dto;

    try {
      const [total, orders] = await this.prisma.$transaction([
        this.prisma.order.count({
          where: { userId: user.id, status, deleted: false },
        }),
        this.prisma.order.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: { userId: user.id, deleted: false, status },
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            products: {
              select: {
                id: true,
                title: true,
                images: true,
                virtual: true,
              },
            },
            courses: {
              select: { id: true, title: true, thumbnail: true },
            },
            // coupon: {
            //   select: {
            //     scope: true,
            //     operator: true,
            //     discount: true,
            //     courses: { select: { id: true, title: true } },
            //     products: { select: { id: true, title: true } },
            //     categories: { select: { id: true, title: true } },
            //   },
            // },
          },
        }),
      ]);

      return { total, orders };
    } catch (err) {
      this.logger.error('failed to list orders', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getCouponByTitle(title: string) {
    try {
      const coupon = await this.prisma.coupon.findFirst({
        where: { title, deleted: false },
        include: { products: true, courses: true, categories: true },
      });

      return coupon;
    } catch (err) {
      this.logger.error('failed to get coupon by title.', err);
      this.logger.debug({ couponTitle: title });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getOrderById(id: number) {
    try {
      const order = await this.prisma.order.findFirst({
        where: { id, deleted: false },
        select: {
          id: true,
          user: true,
          amount: true,
          meta: true,
          status: true,
          courses: true,
          products: true,
          updatedAt: true,
          createdAt: true,
          // coupon: {
          //   select: {
          //     scope: true,
          //     operator: true,
          //     discount: true,
          //     courses: { select: { id: true, title: true } },
          //     products: { select: { id: true, title: true } },
          //     categories: { select: { id: true, title: true } },
          //   },
          // },
        },
      });

      return order;
    } catch (err) {
      this.logger.error('faield to get order by id', err);
      this.logger.debug({ id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
