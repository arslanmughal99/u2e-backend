import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { round } from 'lodash';

import {
  AdminListProductsDto,
  AdminCreateProductDto,
  AdminDeleteProductDto,
  AdminUpdateProductDto,
  AdminGetProductByIdDto,
  AdminListStoreOrdersDto,
  AdminGetStoreOrderByIdDto,
  AdminUpdateStoreOrderDto,
} from './dto/store.dto';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

import { StoreRepository } from '../repository/store.repository';
import { CategoryRepository } from '../repository/category.repository';

@Injectable()
export class AdminStoreService {
  constructor(
    private storeRepository: StoreRepository,
    private categoryRepository: CategoryRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async createProduct(dto: AdminCreateProductDto) {
    const { categoryId, images } = dto;

    const category = await this.categoryRepository.getCategoryById(categoryId);

    if (!category) throw new NotFoundException('Category not found.');

    if (images.length < 2)
      throw new BadRequestException('Minimum 2 images are required.');

    // const imagesOk = await this.uploadService.verifyBulkImageUpload(...images);

    // if (typeof imagesOk === 'string')
    //   throw new NotFoundException(`Invalid images(s) ${imagesOk}.`);

    const imgsVerf = await Promise.all(
      images.map(async (a) => {
        return {
          name: a,
          verified:
            await this.uploadService.verifyAssignmentReplyAttachmentUpload(a),
        };
      }),
    );

    const failed = imgsVerf
      .filter((a) => a.verified === false)
      .map((a) => a.name);
    if (failed.length > 0) throw new NotFoundException('Images(s) not found.');

    const product = await this.storeRepository.createProduct(dto);

    product.category.icon = await this.uploadService.createCategoryIconLink(
      product.category.icon,
    );

    product.images = product.images.map((i) => {
      return this.uploadService.createProductImageLink(i);
    });

    return product;
  }

  async updateProduct(dto: AdminUpdateProductDto) {
    const { id, categoryId, images } = dto;

    const productExist = await this.storeRepository.getProductById({ id });
    if (!productExist) throw new NotFoundException('Product not found.');

    const category = await this.categoryRepository.getCategoryById(categoryId);
    if (!category) throw new NotFoundException('Category not found.');

    if (images) {
      if (images.length < 2)
        throw new BadRequestException('Minimum 2 images are required.');

      const imgsVerf = await Promise.all(
        images.map(async (a) => {
          return {
            name: a,
            verified:
              await this.uploadService.verifyAssignmentReplyAttachmentUpload(a),
          };
        }),
      );

      const failed = imgsVerf
        .filter((a) => a.verified === false)
        .map((a) => a.name);
      if (failed.length > 0)
        throw new NotFoundException('Images(s) not found.');
    }

    const product = await this.storeRepository.updateProduct(dto);

    product.category.icon = await this.uploadService.createCategoryIconLink(
      product.category.icon,
    );

    product.images = product.images.map((i) => {
      return this.uploadService.createProductImageLink(i);
    });

    return product;
  }

  async deleteProduct(dto: AdminDeleteProductDto) {
    const { id } = dto;

    const product = await this.storeRepository.getProductByIdRaw(id);
    if (!product) throw new NotFoundException('Product not found.');

    const deleted = await this.storeRepository.deleteProductById(id);

    return deleted;
  }

  async listProducts(dto: AdminListProductsDto) {
    const p = await this.storeRepository.listProductsAdmin(dto);
    p.products = p.products.map((p) => {
      (p as any).images = p.images.map((i) => {
        return {
          id: i,
          url: this.uploadService.createProductImageLink(i),
        };
      });

      return p;
    });

    return p;
  }

  async getProductById(dto: AdminGetProductByIdDto) {
    const { id } = dto;

    const p = await this.storeRepository.getProductByIdAdmin(id);

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

    (p as any).images = p.images.map((i) => {
      return {
        id: i,
        url: this.uploadService.createProductImageLink(i),
      };
    });
    p.category.icon = await this.uploadService.createCategoryIconLink(
      p.category.icon,
    );

    return p;
  }

  async listStoreOrders(dto: AdminListStoreOrdersDto) {
    const o = await this.storeRepository.listStoreOrdersAdmin(dto);
    o.orders = o.orders.map((or) => {
      or.user.profileImage = this.uploadService.createUserProfileLink(
        or.user.profileImage,
      );
      (or as any).products = or._count.products;
      delete or._count;
      return or;
    });

    return o;
  }

  async getStoreOrderById(dto: AdminGetStoreOrderByIdDto) {
    const { id } = dto;
    const order = await this.storeRepository.getStoreOrderByIdAdmin(id);

    if (!order) throw new NotFoundException('Order not found.');

    order.user.profileImage = this.uploadService.createUserProfileLink(
      order.user.profileImage,
    );

    order.products = order.products.map((p) => {
      (p.product as any).images = p.product.images.map((pi) => ({
        id: pi,
        url: this.uploadService.createProductImageLink(pi),
      }));

      p.product.category.icon = this.uploadService.createCategoryIconLink(
        p.product.category.icon,
      );

      return p;
    });

    return order;
  }

  async updateStoreOrder(dto: AdminUpdateStoreOrderDto) {
    const { id } = dto;

    const exist = await this.storeRepository.getStoreOrderByIdAdmin(id);

    if (!exist) throw new NotFoundException('Order not found.');

    const order = await this.storeRepository.updateStoreOrderByAdmin(dto);

    if (!order) throw new NotFoundException('Order not found.');

    order.user.profileImage = this.uploadService.createUserProfileLink(
      order.user.profileImage,
    );

    order.products = order.products.map((p) => {
      (p.product as any).images = p.product.images.map(async (pi) => ({
        id: pi,
        url: this.uploadService.createProductImageLink(pi),
      }));

      p.product.category.icon = this.uploadService.createCategoryIconLink(
        p.product.category.icon,
      );

      return p;
    });

    return order;
  }

  private calcRatingCount(reviews: { rating: number }[], stars: number) {
    const _reviews = reviews.filter((r) => r.rating === stars);

    return _reviews.length;
  }
}
