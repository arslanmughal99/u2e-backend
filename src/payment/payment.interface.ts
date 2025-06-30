import { Request as RQ } from 'express';
import { RawBodyRequest } from '@nestjs/common';
import { Course, Order, Product } from '@prisma/client';

export interface PaymentMethodBase<C = any, A = any> {
  approveCharge: (args: { body: RawBodyRequest<RQ> }) => Promise<A>;
  // refundCharge: (
  //   order: Partial<Order> & {
  //     products: Product[];
  //     courses: Course[];
  //   },
  // ) => Promise<R>;
  createCharge: (
    order: Partial<Order> & {
      products: Product[];
      courses: Course[];
    },
  ) => Promise<C>;
}
