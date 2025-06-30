import {
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

import {
  ListProductsDto,
  GetProductByIdDto,
  ListStoreOrdersDto,
  GetStoreOrderByIdDto,
  ListProductReviewsDto,
  CreateProductReviewDto,
} from './store.dto';
import { StoreService } from './store.service';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('store')
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Get('product')
  async listProducts(@Query() dto: ListProductsDto) {
    const res = await this.storeService.listProducts(dto);
    return res;
  }

  @Get('order')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listOrders(@Query() dto: ListStoreOrdersDto, @GetUser() user: User) {
    dto.user = user;
    const res = await this.storeService.listOrders(dto);
    return res;
  }

  @Get('order/:id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listOrdersById(
    @Param() dto: GetStoreOrderByIdDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.storeService.getOrderById(dto);
    return res;
  }

  @Get('product/review')
  async listProductReviews(
    @Query() dto: ListProductReviewsDto,
    @Headers('Authorization')
    authToken?: string,
  ) {
    const res = await this.storeService.listProductReviews(dto, authToken);
    return res;
  }

  @Post('product/review')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async createProductReview(
    @Body() dto: CreateProductReviewDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.storeService.createProductReview(dto);
    return res;
  }

  @Get('product/:id')
  async getProductById(@Param() dto: GetProductByIdDto) {
    const res = await this.storeService.getProductById(dto);
    return res;
  }
}
