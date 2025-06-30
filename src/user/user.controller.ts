import { User } from '@prisma/client';
import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';

import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { FindInstructorDto, UpdateUserDto } from './user.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getUserInfo(@GetUser() user: User) {
    const res = this.userService.getUserInfo(user);
    return res;
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateUser(@Body() dto: UpdateUserDto, @GetUser() user: User) {
    const res = await this.userService.updateUser(dto, user);
    return res;
  }
}

@Controller('instructor')
export class InstructorController {
  constructor(private userService: UserService) {}

  @Get()
  async findInstructor(@Query() dto: FindInstructorDto) {
    const res = await this.userService.findInstructor(dto);
    return res;
  }
}
