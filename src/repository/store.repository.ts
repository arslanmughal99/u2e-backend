import {
  Logger,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { round } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, User } from '@prisma/client';

import {
  ListProductsDto,
  GetProductByIdDto,
  ListProductSortBy,
  ListStoreOrdersDto,
  GetStoreOrderByIdDto,
  ListProductReviewsDto,
  CreateProductReviewDto,
} from '../store/store.dto';
import {
  AdminCreateProductDto,
  AdminListProductsDto,
  AdminListStoreOrdersDto,
  AdminUpdateProductDto,
  AdminUpdateStoreOrderDto,
} from '../admin/dto/store.dto';
import { PrismaService } from './prisma.service';
import { CreateStoreOrder } from '../store/store.interface';

@Injectable()
export class StoreRepository {
  private exceptionMsg: string;
  private logger = new Logger('StoreRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async listProducts(dto: ListProductsDto) {
    const { page, size, sortBy, search, filterBy, categoryId } = dto;

    try {
      const [total, _products] = await this.prisma.$transaction([
        this.prisma.product.count({
          where: {
            categoryId,
            deleted: false,
            title: { mode: 'insensitive', contains: search },
            availability: filterBy ? { equals: filterBy } : undefined,
          },
        }),
        this.prisma.product.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy:
            sortBy && sortBy === ListProductSortBy.Newest
              ? { createdAt: 'desc' }
              : sortBy === ListProductSortBy.LowestPrice
              ? { price: 'asc' }
              : sortBy === ListProductSortBy.HighestPrice
              ? { price: 'desc' }
              : undefined,
          where: {
            categoryId,
            deleted: false,
            title: { mode: 'insensitive', contains: search },
            availability: filterBy ? { equals: filterBy } : undefined,
          },
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            virtual: true,
            updatedAt: true,
            createdAt: true,
            attributes: true,
            description: true,
            availability: true,
            shippingRate: true,
            specifications: true,
            reviews: { select: { rating: true } },
            category: { select: { id: true, title: true, icon: true } },
          },
        }),
      ]);

      const products = _products.map((p) => {
        // Calculating average rating
        // It is more convinient and efficient to calculate
        // in application layer rather then Db layer
        (p as any).rating =
          p.reviews.length > 0
            ? round(
                p.reviews.reduce((sum, rating) => {
                  sum.rating = sum.rating + rating.rating;
                  return sum;
                }).rating / p.reviews.length,
                2,
              )
            : 0;

        delete p.reviews;
        return p;
      });

      return { total, products };
    } catch (err) {
      this.logger.error('failed to list products', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  // for internal use only
  async getProductByIdRaw(id: number) {
    try {
      const product = await this.prisma.product.findFirst({
        where: { id },
      });
      return product;
    } catch (err) {
      this.logger.error('failed to get raw product by id.', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getProductById(dto: GetProductByIdDto) {
    const { id } = dto;

    try {
      const product = await this.prisma.product.findFirst({
        where: {
          id,
          deleted: false,
        },
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          virtual: true,
          updatedAt: true,
          createdAt: true,
          attributes: true,
          description: true,
          availability: true,
          shippingRate: true,
          specifications: true,
          reviews: { select: { rating: true } },
          category: { select: { id: true, title: true, icon: true } },
        },
      });

      return product;
    } catch (err) {
      this.logger.error('failed to get product by id', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getOrderByProductAndUser(productId: number, user: User) {
    try {
      const order = await this.prisma.storeOrder.findFirst({
        include: { products: true },
        where: { products: { some: { productId } }, userId: user.id },
      });

      return order;
    } catch (err) {
      this.logger.error('failed to get store order by id and user', err);
      this.logger.debug({ productId, username: user.username });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createProductReview(dto: CreateProductReviewDto) {
    const { id, rating, review, user, productId } = dto;

    try {
      const _review = await this.prisma.review.upsert({
        update: { rating, review },
        where: { id: id ?? -1, productId, userId: user.id },
        create: { rating, review, productId, userId: user.id },
        select: {
          rating: true,
          review: true,
          product: { select: { id: true, title: true } },
        },
      });

      return _review;
    } catch (err) {
      this.logger.error('failed to create review.', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listReviews(dto: ListProductReviewsDto, user?: User) {
    const { page, size, rating, productId, onlyOwned } = dto;

    try {
      const [total, reviews] = await this.prisma.$transaction([
        this.prisma.review.count({
          where: {
            productId,
            rating,
            userId: user && onlyOwned ? user.id : undefined,
          },
        }),
        this.prisma.review.findMany({
          take: size,
          orderBy: { id: 'desc' },
          skip: (page - 1) * size,
          where: {
            rating,
            productId,
            userId: user && onlyOwned ? user.id : undefined,
          },
          select: {
            id: true,
            rating: true,
            review: true,
            user: { select: { id: true, username: true, profileImage: true } },
          },
        }),
      ]);

      return { total, reviews };
    } catch (err) {
      this.logger.error('failed to list product reviews', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getReviewByProductAndUser(productId: number, user: User) {
    try {
      const review = await this.prisma.review.findFirst({
        where: { productId, userId: user.id },
      });

      return review;
    } catch (err) {
      this.logger.error('failed to get review by product and user', err);
      this.logger.debug({ productId, userId: user.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  // private calcRatingCount(reviews: { rating: number }[], stars: number) {
  //   const _reviews = reviews.filter((r) => r.rating === stars);

  //   return _reviews.length;
  // }

  async getProductsByIds(ids: number[]) {
    try {
      const products = await this.prisma.product.findMany({
        where: {
          deleted: false,
          id: { in: ids },
        },
      });

      return products;
    } catch (err) {
      this.logger.error('failed to get products by ids', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createStoreOrders(args: {
    tx?: Partial<PrismaClient>;
    storeOrders: CreateStoreOrder;
  }) {
    const {
      tx,
      storeOrders: { amount, products, status, userId },
    } = args;
    const db = tx ? tx : this.prisma;

    const storeOrder = await db.storeOrder.create({
      data: {
        amount,
        status,
        userId,
        products: { createMany: { data: products } },
      },
      include: { user: true },
    });
    return storeOrder;
  }

  async listStoreOrders(dto: ListStoreOrdersDto) {
    const { status, page, size, user } = dto;
    try {
      const [total, orders] = await this.prisma.$transaction([
        this.prisma.storeOrder.count({
          where: { status, deleted: false, userId: user.id },
        }),
        this.prisma.storeOrder.findMany({
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { products: true } },
          },
          take: size,
          skip: (page - 1) * size,
          where: { status, deleted: false, userId: user.id },
        }),
      ]);
      return { total, orders };
    } catch (err) {
      this.logger.error('failed to get store orders', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getOrderById(dto: GetStoreOrderByIdDto) {
    const { id, user } = dto;

    try {
      const order = await this.prisma.storeOrder.findFirst({
        select: {
          id: true,
          status: true,
          amount: true,
          deleted: true,
          createdAt: true,
          updatedAt: true,
          products: {
            select: {
              // createdAt: true,
              // discountedAmount: true,
              product: {
                select: { id: true, title: true, images: true, price: true },
              },
            },
          },
        },
        where: { id, deleted: false, userId: user.id },
      });

      return order;
    } catch (err) {
      this.logger.error('failed to get order by id', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description create new store product (by admin)
   */
  async createProduct(dto: AdminCreateProductDto) {
    const {
      title,
      price,
      images,
      virtual,
      categoryId,
      attributes,
      description,
      availability,
      shippingRate,
      specifications,
    } = dto;

    try {
      const product = await this.prisma.product.create({
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          virtual: true,
          createdAt: true,
          attributes: true,
          description: true,
          shippingRate: true,
          availability: true,
          specifications: true,
          category: { select: { id: true, title: true, icon: true } },
        },
        data: {
          title,
          price,
          images,
          virtual,
          categoryId,
          attributes,
          description,
          availability,
          shippingRate,
          specifications,
        },
      });

      return product;
    } catch (err) {
      this.logger.error('failed to create product by admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description update new store product (by admin)
   */
  async updateProduct(dto: AdminUpdateProductDto) {
    const {
      id,
      title,
      price,
      images,
      virtual,
      categoryId,
      attributes,
      description,
      availability,
      shippingRate,
      specifications,
    } = dto;

    try {
      const product = await this.prisma.product.update({
        where: { id },
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          virtual: true,
          createdAt: true,
          attributes: true,
          description: true,
          shippingRate: true,
          availability: true,
          specifications: true,
          category: { select: { id: true, title: true, icon: true } },
        },
        data: {
          title,
          price,
          images,
          virtual,
          categoryId,
          attributes,
          description,
          availability,
          shippingRate,
          specifications,
        },
      });

      return product;
    } catch (err) {
      this.logger.error('failed to create product by admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description soft delete product (by admin)
   */
  async deleteProductById(id: number) {
    try {
      const d = await this.prisma.product.update({
        where: { id },
        select: {
          id: true,
          deleted: true,
        },
        data: { deleted: true },
      });

      return d;
    } catch (err) {
      this.logger.error('failed to delete product', err);
      throw new NotFoundException(this.exceptionMsg);
    }
  }

  /**
   * @description list products for admin
   */
  async listProductsAdmin(dto: AdminListProductsDto) {
    const { page, size, search, virtual, categoryId, availability } = dto;

    try {
      const [total, products] = await this.prisma.$transaction([
        this.prisma.product.count({
          where: {
            virtual,
            categoryId,
            availability,
            deleted: false,
            title: { contains: search, mode: 'insensitive' },
          },
        }),
        this.prisma.product.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            virtual: true,
            createdAt: true,
            availability: true,
          },
          where: {
            virtual,
            categoryId,
            availability,
            deleted: false,
            title: { contains: search, mode: 'insensitive' },
          },
        }),
      ]);

      return { total, products };
    } catch (err) {
      this.logger.error('failed to list admin products', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description get single product with rating aggrigated for admin
   */
  async getProductByIdAdmin(id: number) {
    try {
      const product = await this.prisma.product.findFirst({
        where: {
          id,
          deleted: false,
        },
        select: {
          id: true,
          title: true,
          price: true,
          images: true,
          virtual: true,
          updatedAt: true,
          createdAt: true,
          attributes: true,
          description: true,
          availability: true,
          shippingRate: true,
          specifications: true,
          reviews: { select: { rating: true } },
          category: { select: { id: true, title: true, icon: true } },
        },
      });

      return product;
    } catch (err) {
      this.logger.error('failed to get product by id for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description list store orders for admin
   */
  async listStoreOrdersAdmin(dto: AdminListStoreOrdersDto) {
    const { page, size, status, userId } = dto;

    try {
      const [total, orders] = await this.prisma.$transaction([
        this.prisma.storeOrder.count({
          where: { status, userId, deleted: false },
        }),
        this.prisma.storeOrder.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: { status, userId, deleted: false },
          select: {
            id: true,
            status: true,
            amount: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                profileImage: true,
              },
            },
            _count: { select: { products: true } },
          },
        }),
      ]);
      return { total, orders };
    } catch (err) {
      this.logger.error('failed to list store orders for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description get single store order by id (for admin)
   */
  async getStoreOrderByIdAdmin(id: number) {
    try {
      const storeOrder = await this.prisma.storeOrder.findFirst({
        where: { id, deleted: false },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          products: {
            select: {
              discountedAmount: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  images: true,
                  category: { select: { id: true, title: true, icon: true } },
                },
              },
            },
          },
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
      return storeOrder;
    } catch (err) {
      this.logger.error('failed to get store order by id for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Update store order status (by admin)
   */
  async updateStoreOrderByAdmin(dto: AdminUpdateStoreOrderDto) {
    const { id, status } = dto;

    try {
      const order = await this.prisma.storeOrder.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          products: {
            select: {
              discountedAmount: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  images: true,
                  category: { select: { id: true, title: true, icon: true } },
                },
              },
            },
          },
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
      return order;
    } catch (err) {
      this.logger.error('failed to udpate store order by admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
