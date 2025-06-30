import {
  Req,
  Get,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Controller,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { LoginUserDto, RefreshSessionDto } from './auth.dto';

@Controller('')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    const res = await this.authService.login(dto);
    return res;
  }

  @Post('refresh')
  async refreshSession(@Body() dto: RefreshSessionDto) {
    const res = await this.authService.refreshSession(dto);
    return res;
  }

  @Get('/facebook/auth')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin() {
    return HttpStatus.OK;
  }

  @Get('/facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthRedirect(@Req() req: any) {
    return req.user;
  }
}
