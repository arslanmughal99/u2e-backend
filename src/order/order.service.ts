import {
  Order,
  Coupon,
  Course,
  Product,
  Category,
  BillingType,
  CouponScope,
  OrderStatus,
  CouponOperator,
  StoreOrderStatus,
  NotificationScope,
  ProductAvailability,
} from '@prisma/client';
import {
  Inject,
  Logger,
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';
import { chain, flatten, intersectionBy, round } from 'lodash';

import {
  OrderMeta,
  OrderCoursesMeta,
  OrderProductsMeta,
} from './order.interface';
import {
  ListOrdersDto,
  PlaceOrdersDto,
  BundleEnrollment,
  CourseEnrollment,
} from './order.dto';
import { CreateStoreOrder } from '../store/store.interface';
import { PrismaService } from '../repository/prisma.service';
import { StoreRepository } from '../repository/store.repository';
import { OrderRepository } from '../repository/order.repository';
import { BundleRepository } from '../repository/bundle.repository';
import { CourseRepository } from '../repository/course.repository';
import { CreateStatement } from '../statement/statement.interface';
import { CreateEnrollment } from '../enrollment/enrollment.interface';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';
import { EnrolledRepository } from '../repository/enrolled.repository';
import { StatementRepository } from '../repository/statement.repository';
import { RewardPointsService } from '../reward-points/reward-points.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsRepository } from '../repository/notifications.repository';
import { RewardPointsConditionKey } from '../repository/reward-points.repository';

@Injectable()
export class OrderService {
  private exceptionMsg: string;
  private logger = new Logger('OrderService');
  constructor(
    private prisma: PrismaService,
    private configs: ConfigService,
    private storeRepository: StoreRepository,
    private orderRepository: OrderRepository,
    private bundleRepository: BundleRepository,
    private courseRepository: CourseRepository,
    private rewardPointsService: RewardPointsService,
    private enrollmentRepository: EnrolledRepository,
    private statementRepository: StatementRepository,
    private notificationService: NotificationsService,
    private notificationRepository: NotificationsRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async placeOrder(dto: PlaceOrdersDto) {
    const {
      user,
      productIds,
      bundles: bundleIds,
      courses: courseIds,
      coupon: _couponCode,
    } = dto;

    let coupon:
      | (Coupon & {
          products: Product[];
          courses: Course[];
          categories: Category[];
        })
      | undefined;
    if (_couponCode) {
      coupon = await this.orderRepository.getCouponByTitle(_couponCode);
    }

    // Calculating products with meta
    const { meta: productsMeta, products } = await this.calcProductMeta({
      coupon,
      productIds,
    });

    // Calculating bundles with meta
    const { meta: bundleCoursesMeta, courses: bundleCourses } =
      await this.calcBundleMeta({ bundles: bundleIds });

    // Calculating courses with meta
    const { courses, meta: coursesMeta } = await this.calcCoursesMeta({
      courses: courseIds,
      coupon,
    });

    // Check if there are any courses that overlap with bundle courses
    const overLapingCourses = intersectionBy(
      coursesMeta,
      bundleCoursesMeta,
      'id',
    );

    if (overLapingCourses && overLapingCourses.length > 0)
      throw new ConflictException(
        `Following course(s) are overlaping with bundle(s)\n${overLapingCourses
          .map((oc) => oc.course)
          .join('\n')}`,
      );

    const _alreadyEnrolled =
      await this.enrollmentRepository.getEnrollmentsByCoursesAndStudent(
        user.id,
        courses.map((c) => c.id).concat(bundleCourses.map((bc) => bc.id)),
      );

    const alreadyEnrolled = _alreadyEnrolled.filter((e) => {
      if (!e.expiry) {
        return true;
      }
      // Checking if course enrollment is is not expired
      const exp = dayjs(e.expiry);
      if (exp.diff() > 0) return true;
    });

    if (alreadyEnrolled.length > 0)
      throw new ConflictException(
        `Following courses are already enrolled\n${alreadyEnrolled
          .map((e) => e.course.title)
          .join('\n')}`,
      );

    // Merging product and course meta in order meta
    const meta: OrderMeta = {
      products: productsMeta,
      courses: coursesMeta.concat(bundleCoursesMeta),
    };

    const allCourses = courses.concat(bundleCourses);

    const order = await this.prisma.$transaction(async (tx) => {
      const _order = await this.orderRepository.createOrder({
        tx,
        meta,
        user,
        coupon,
        products,
        courses: allCourses,
      });

      const notification = await this.notificationRepository.createNotification(
        {
          tx,
          notification: {
            user,
            // userId: user.id,
            title: 'Order placed successfully',
            scope: NotificationScope.Individual,
            message:
              'Your order is successfully placed. Please proceed to payment.',
          },
        },
      );

      // (notification as any).user = user;

      await this.notificationService.sendUserNotification({
        ...notification,
        user,
      } as any);

      return _order;
    });

    if (order.amount === 0) {
      await this.executeOrder(order);
    }

    // await this.notificationRepository.createNotification({
    //   userId: user.id,
    //   title: data.title,
    //   message: data.message,
    //   scope: NotificationScope.Individual,
    // });
    // this.notificationService.sendUserNotification(user, {
    //   title: 'Order placed',
    //   message: 'Your order is successfully placed. Please proceed to payment.',
    // });

    const { id } = order;
    return { id };
  }

  async listOrders(dto: ListOrdersDto) {
    const o = await this.orderRepository.listOrders(dto);

    o.orders = o.orders.map((_o) => {
      _o.products = _o.products.map((p) => {
        p.images = p.images.map((i) => {
          return this.uploadService.createProductImageLink(i);
        });

        return p;
      });

      _o.courses = _o.courses.map((p) => {
        p.thumbnail = this.uploadService.createCourseThumbnailLink(p.thumbnail);
        return p;
      });

      return _o;
    });

    return o;
  }

  // Calcuate new price for course after coupon applied
  private calcCouponPrice(
    price: number,
    coupon: Partial<Coupon & Partial<Product>>,
  ) {
    switch (coupon.operator) {
      case CouponOperator.Flat:
        return price - coupon.discount;
      case CouponOperator.Percentage:
        return round((price / 100) * coupon.discount, 2);
    }
  }

  // Apply coupon on price
  // Generate metadata for products
  private async calcProductMeta(args: {
    productIds: number[];
    coupon?: Coupon & { products: Product[]; categories: Category[] };
  }) {
    const { productIds: productsIds, coupon } = args;
    if (!productsIds) return { meta: [], products: [] };
    const products = await this.storeRepository.getProductsByIds(productsIds);

    const outOfStock = products.filter(
      (p) => p.availability === ProductAvailability.OutOfStock,
    );

    if (outOfStock.length > 0)
      throw new NotFoundException(
        `Following product(s) are out of stock\n${outOfStock
          .map((o) => o.title)
          .join('\n')}`,
      );

    const meta: OrderProductsMeta[] = [];
    products.forEach((product) => {
      let discountedPrice: number | undefined;

      // Applying Coupuon
      if (coupon) {
        switch (coupon.scope) {
          case CouponScope.Category:
            if (
              coupon.categories.map((c) => c.id).includes(product.categoryId)
            ) {
              discountedPrice = this.calcCouponPrice(product.price, coupon);
            }
            break;
          case CouponScope.Product:
            if (coupon.products.map((p) => p.id).includes(product.id)) {
              discountedPrice = this.calcCouponPrice(product.price, coupon);
            }
            break;
          case CouponScope.Global:
            discountedPrice = this.calcCouponPrice(product.price, coupon);
            break;
        }
      }

      meta.push({
        id: product.id,
        discountedPrice,
        price: product.price,
      });

      return product;
    });

    return { meta, products };
  }
  // Apply coupon on price
  // Generate metadata for courses, And price with months? duration
  private async calcCoursesMeta(args: {
    courses: CourseEnrollment[];
    coupon?: Coupon & { courses: Course[]; categories: Category[] };
  }) {
    const { courses: _coursesMeta, coupon } = args;
    if (!_coursesMeta) return { meta: [], courses: [] };

    const courses = await this.courseRepository.getCoursesByIds(
      _coursesMeta.map((cm) => cm.courseId),
    );

    const meta: OrderCoursesMeta[] = [];
    courses.forEach((course) => {
      const currentCourseMeta = _coursesMeta.find(
        (cmeta) => cmeta.courseId === course.id,
      );

      let discountedPrice: number | undefined;

      // Applying Coupuon
      if (coupon) {
        switch (coupon.scope) {
          case CouponScope.Category:
            if (
              coupon.categories.map((c) => c.id).includes(course.categoryId)
            ) {
              discountedPrice = this.calcCouponPrice(course.price, coupon);
            }
            break;
          case CouponScope.Course:
            if (coupon.courses.map((cid) => cid.id).includes(course.id)) {
              discountedPrice = this.calcCouponPrice(course.price, coupon);
            }
            break;
          case CouponScope.Global:
            discountedPrice = this.calcCouponPrice(course.price, coupon);
            break;
        }
      }

      meta.push({
        id: course.id,
        discountedPrice,
        price: course.price,
        course: course.title,
        months:
          course.billingType === BillingType.Monthly
            ? currentCourseMeta.months
            : undefined,
      });

      return course;
    });

    return { meta, courses };
  }

  // Generate metadata for bundles, And price with months? duration
  private async calcBundleMeta(args: { bundles: BundleEnrollment[] }) {
    const { bundles: _bundlesMeta } = args;
    if (!_bundlesMeta) return { meta: [], courses: [] };
    const bundles = await this.bundleRepository.getCoursesBundlesByIds(
      _bundlesMeta.map((bm) => bm.bundleId),
    );

    const meta: OrderCoursesMeta[] = [];
    const courses = flatten(
      bundles.map((bundle) => {
        const currentBundleMeta = _bundlesMeta.find(
          (bmeta) => bmeta.bundleId === bundle.id,
        );

        return bundle.courses.map((course) => {
          meta.push({
            id: course.id,
            bundleId: bundle.id,
            bundle: bundle.title,
            course: course.title,
            bundlePrice: bundle.price,
            months:
              bundle.billingType === BillingType.Monthly
                ? currentBundleMeta.months
                : undefined,
          });

          return course;
        });
      }),
    );

    return { meta, courses };
  }

  async executeOrder(
    order: Order & {
      courses: Course[];
      products: Product[];
    },
    paymentId?: number,
  ) {
    const { courses, products } = order;
    const meta: OrderMeta = order.meta as any;

    const _statements: CreateStatement[] = [];
    const _enrollments: CreateEnrollment[] = [];
    const _storeOrder: CreateStoreOrder = {
      amount: 0,
      products: [],
      userId: order.userId,
      status: StoreOrderStatus.Paid,
    };

    // Creating store orders
    meta.products.forEach((_pMeta) => {
      const _product = products.find((_p) => _p.id === _pMeta.id);
      if (!_product) return;

      // create store order
      _storeOrder.products.push({
        productId: _product.id,
        discountedAmount: _pMeta.discountedPrice,
      });

      // calc store orders amount
      _storeOrder.amount = meta.products.reduce((sum, _pMeta) => {
        sum += _pMeta.discountedPrice ? _pMeta.discountedPrice : _pMeta.price;
        return sum;
      }, 0);

      // Creating product statements
      _statements.push({
        paymentId,
        productId: _pMeta.id,
        userId: order.userId,
        amount: _pMeta.discountedPrice ? _pMeta.discountedPrice : _pMeta.price,
      });
    });

    // Creating enrollments
    meta.courses.forEach((_cMeta) => {
      const _course = courses.find((_c) => _c.id === _cMeta.id);
      if (!_course) return;

      // Create single courses only statements
      if (!_cMeta.bundleId) {
        _statements.push({
          paymentId,
          courseId: _course.id,
          userId: order.userId,
          amount: _cMeta.discountedPrice
            ? _cMeta.discountedPrice
            : _cMeta.price,
        });
      }

      const expiry = _cMeta.months
        ? dayjs(Date.now()).add(_cMeta.months, 'months').toDate()
        : undefined;

      _enrollments.push({
        expiry,
        courseId: _course.id,
        studentId: order.userId,
      });
    });

    // Creating bundles only statements
    chain(meta.courses)
      .groupBy('bundleId')
      .omitBy((v, k) => k === 'undefined')
      .map((g) => g[0])
      .forEach((_bMeta) => {
        _statements.push({
          paymentId,
          userId: order.userId,
          bundleId: _bMeta.bundleId,
          amount: _bMeta.bundlePrice,
        });
      })
      .value();

    try {
      await this.prisma.$transaction(async (tx) => {
        order.executed = new Date();
        order.status = OrderStatus.Completed;
        const storeOrder = await this.storeRepository.createStoreOrders({
          tx,
          storeOrders: _storeOrder,
        });
        if (storeOrder)
          await this.rewardPointsService.giveRewardPoints(
            storeOrder.user,
            RewardPointsConditionKey.PurchaseStoreProducts,
          );

        await this.enrollmentRepository.createEnrollments({
          tx,
          enrollments: _enrollments,
        });
        await this.statementRepository.createStatements({
          tx,
          statements: _statements,
        });

        await this.orderRepository.updateOrder({ tx, order });
      });

      this.logger.debug(`order ${order.id} executed`);
    } catch (err) {
      this.logger.error('failed to exucute order', err);
      this.logger.debug({ orderId: order.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
