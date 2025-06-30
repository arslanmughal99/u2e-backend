import {
  Get,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import {
  AdminListUsersDto,
  AdminUpdateUserDto,
  AdminGetUserInfoDto,
  AdminResetUserPasswordDto,
} from './dto/user.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminUserService } from './user.service';

@Controller('admin/user')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UserController {
  constructor(private userService: AdminUserService) {}

  @Get()
  @Roles(UserRole.Admin)
  async listUsers(@Query() dto: AdminListUsersDto) {
    const res = await this.userService.listUsers(dto);
    return res;
  }

  @Patch()
  @Roles(UserRole.Admin)
  async updateUserInfo(@Body() dto: AdminUpdateUserDto) {
    const res = await this.userService.updateUser(dto);
    return res;
  }

  @Patch('reset-password')
  @Roles(UserRole.Admin)
  async resetPassword(@Body() dto: AdminResetUserPasswordDto) {
    return await this.userService.resetPassword(dto);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  async getUserInfo(@Param() dto: AdminGetUserInfoDto) {
    const user = await this.userService.getUserById(dto);
    return user;
  }
}
