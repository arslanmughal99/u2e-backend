import {
  Get,
  Body,
  Post,
  Query,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import {
  AdminListProductsDto,
  AdminCreateProductDto,
  AdminDeleteProductDto,
  AdminGetProductByIdDto,
  AdminUpdateProductDto,
  AdminListStoreOrdersDto,
  AdminGetStoreOrderByIdDto,
  AdminUpdateStoreOrderDto,
} from './dto/store.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminStoreService } from './store.service';

@Controller('admin/store')
@UseGuards(JwtAuthGuard, RoleGuard)
export class StoreController {
  constructor(private storeService: AdminStoreService) {}

  @Get('product')
  @Roles(UserRole.Admin)
  async listProduct(@Query() dto: AdminListProductsDto) {
    const res = await this.storeService.listProducts(dto);
    return res;
  }

  @Post('product')
  @Roles(UserRole.Admin)
  async createProduct(@Body() dto: AdminCreateProductDto) {
    const res = await this.storeService.createProduct(dto);
    return res;
  }

  @Patch('product')
  @Roles(UserRole.Admin)
  async updateProduct(@Body() dto: AdminUpdateProductDto) {
    const res = await this.storeService.updateProduct(dto);
    return res;
  }

  @Delete('product')
  @Roles(UserRole.Admin)
  async deleteProduct(@Body() dto: AdminDeleteProductDto) {
    const res = await this.storeService.deleteProduct(dto);
    return res;
  }

  @Get('order')
  @Roles(UserRole.Admin)
  async listStoreOrders(@Query() dto: AdminListStoreOrdersDto) {
    const res = await this.storeService.listStoreOrders(dto);
    return res;
  }

  @Patch('order')
  @Roles(UserRole.Admin)
  async updateStoreOrders(@Body() dto: AdminUpdateStoreOrderDto) {
    const res = await this.storeService.updateStoreOrder(dto);
    return res;
  }

  @Get('order/:id')
  @Roles(UserRole.Admin)
  async getStoreOrderById(@Param() dto: AdminGetStoreOrderByIdDto) {
    const res = await this.storeService.getStoreOrderById(dto);
    return res;
  }

  @Get('product/:id')
  @Roles(UserRole.Admin)
  async getProductById(@Param() dto: AdminGetProductByIdDto) {
    const res = await this.storeService.getProductById(dto);
    return res;
  }
}
