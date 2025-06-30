import {
  Req,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Controller,
  HttpStatus,
} from '@nestjs/common';
import { PaymentMethod, User, UserRole } from '@prisma/client';

import { PayOrderDto } from './payment.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PaymentService } from './payment.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.Admin,
    UserRole.Student,
    UserRole.Instructor,
    UserRole.Organization,
  )
  async payOrder(@Body() dto: PayOrderDto, @GetUser() user: User) {
    dto.user = user;
    const res = await this.paymentService.createCharge(dto);
    return res;
  }

  @Post('yoco-webhook')
  @HttpCode(HttpStatus.OK)
  async approveYocoPayment(@Req() req: any) {
    const res = await this.paymentService.approveOrder(req, PaymentMethod.Yoco);
    return res;
  }
}
