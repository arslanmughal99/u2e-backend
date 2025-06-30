import { User, UserRole } from '@prisma/client';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { RoleGuard } from '../auth/role.guard';
import { OrderService } from './order.service';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { ListOrdersDto, PlaceOrdersDto } from './order.dto';

@Controller('order')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async placeOrder(@Body() dto: PlaceOrdersDto, @GetUser() user: User) {
    dto.user = user;
    const res = await this.orderService.placeOrder(dto);
    return res;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.Admin,
    UserRole.Student,
    UserRole.Instructor,
    UserRole.Organization,
  )
  async listOrders(@Query() dto: ListOrdersDto, @GetUser() user: User) {
    dto.user = user;
    const res = await this.orderService.listOrders(dto);
    return res;
  }
}
