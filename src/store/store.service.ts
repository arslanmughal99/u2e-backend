import {
  Inject,
  Logger,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { round } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { StoreOrderStatus, User } from '@prisma/client';

import {
  ListProductsDto,
  GetProductByIdDto,
  ListStoreOrdersDto,
  GetStoreOrderByIdDto,
  ListProductReviewsDto,
  CreateProductReviewDto,
} from './store.dto';
import { AuthUtils } from '../auth/auth.utils';
import { StoreRepository } from '../repository/store.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

@Injectable()
export class StoreService {
  private exceptionMsg: string;
  private logger = new Logger('StoreService');
  constructor(
    private authUtils: AuthUtils,
    private configs: ConfigService,
    private storeRepository: StoreRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async listProducts(dto: ListProductsDto) {
    const p = await this.storeRepository.listProducts(dto);

    p.products = p.products.map((_p) => {
      _p.images = _p.images.map((i) => {
        return this.uploadService.createProductImageLink(i);
      });
      _p.category.icon = this.uploadService.createCategoryIconLink(
        _p.category.icon,
      );

      return _p;
    });

    return p;
  }

  async getProductById(dto: GetProductByIdDto) {
    const p = await this.storeRepository.getProductById(dto);

    if (!p) throw new NotFoundException('Product not found.');

    (p as any).rating = {
      onestar: this.calcRatingCount(p.reviews, 1),
      twostar: this.calcRatingCount(p.reviews, 2),
      threestar: this.calcRatingCount(p.reviews, 3),
      fourstar: this.calcRatingCount(p.reviews, 4),
      fivestar: this.calcRatingCount(p.reviews, 5),
      average:
        p.reviews.length > 0
          ? round(
              p.reviews.reduce((sum, rating) => {
                sum.rating = sum.rating + rating.rating;
                return sum;
              }).rating / p.reviews.length,
              2,
            )
          : 0,
    };

    delete p.reviews;

    p.images = p.images.map((i) => {
      return this.uploadService.createProductImageLink(i);
    });

    p.category.icon = this.uploadService.createCategoryIconLink(
      p.category.icon,
    );

    return p;
  }

  async listOrders(dto: ListStoreOrdersDto) {
    const o = await this.storeRepository.listStoreOrders(dto);
    o.orders.map((_o) => {
      (_o as any).products = _o._count.products;
      delete _o._count;

      return _o;
    });

    return o;
  }

  async getOrderById(dto: GetStoreOrderByIdDto) {
    const o = await this.storeRepository.getOrderById(dto);

    o.products = o.products.map((_p) => {
      _p.product.images = _p.product.images.map((i) => {
        return this.uploadService.createProductImageLink(i);
      });
      return _p;
    });

    return o;
  }

  async createProductReview(dto: CreateProductReviewDto) {
    const { user, productId } = dto;
    const exist = await this.storeRepository.getReviewByProductAndUser(
      productId,
      user,
    );

    if (exist) dto.id = exist.id;

    const order = await this.storeRepository.getOrderByProductAndUser(
      productId,
      user,
    );

    if (!order)
      throw new NotFoundException("You haven't purchase the product.");

    if (order.status !== StoreOrderStatus.Deliverd)
      throw new ForbiddenException(
        'You cannot review before order is develiverd.',
      );

    const review = await this.storeRepository.createProductReview(dto);
    return review;
  }

  async listProductReviews(dto: ListProductReviewsDto, _token?: string) {
    let user: User;
    if (_token) user = await this.authUtils.validateUser(_token);
    const r = await this.storeRepository.listReviews(dto, user);

    r.reviews = r.reviews.map((_r) => {
      if (_r.user.profileImage)
        _r.user.profileImage = this.uploadService.createProductImageLink(
          _r.user.profileImage,
        );

      return _r;
    });

    return r;
  }

  private calcRatingCount(reviews: { rating: number }[], stars: number) {
    const _reviews = reviews.filter((r) => r.rating === stars);

    return _reviews.length;
  }
}
