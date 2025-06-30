import { Body, Controller, Post } from '@nestjs/common';

import { RegisterStudentDto } from './user.dto';
import { RegisterService } from './register.service';

@Controller('')
export class RegisterController {
  constructor(private registerService: RegisterService) {}

  @Post('register')
  async registerStudent(@Body() dto: RegisterStudentDto) {
    return await this.registerService.registerStudent(dto);
  }
}
