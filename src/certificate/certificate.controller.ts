import {
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

import {
  ListCertificatesDto,
  RequestCertificateDto,
  GetCertificateByIdDto,
} from './certificate.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { CertificateService } from './certificate.service';

@Controller('certificate')
export class CertificateController {
  constructor(private certificateService: CertificateService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async requestCertificate(
    @Body() dto: RequestCertificateDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.certificateService.requestCertificate(dto);
    return res;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Organization)
  async listCertificates(
    @Query() dto: ListCertificatesDto,
    @GetUser() user: User,
  ) {
    dto.user = user;
    const res = await this.certificateService.listCertificates(dto);
    return res;
  }

  @Get(':id')
  async getCertificateById(@Param() dto: GetCertificateByIdDto) {
    const res = await this.certificateService.getCertificateById(dto);
    return res;
  }
}
