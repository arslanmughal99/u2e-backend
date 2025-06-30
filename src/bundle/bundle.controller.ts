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
import { User, UserRole } from '@prisma/client';

import {
  ListBundlesDto,
  CreateBundleDto,
  DeleteBundleDto,
  UpdateBundleDto,
  GetBundleByIdDto,
  ListInstructorBundlesDto,
} from './bundle.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { BundleService } from './bundle.service';
import { GetRealIp } from '../auth/get-ip.decorator';
import { GetUser } from '../auth/get-user.decorator';

@Controller('bundle')
export class BundleController {
  constructor(private bundleService: BundleService) {}

  @Post('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async createBundle(
    @Body() dto: CreateBundleDto,
    @GetUser() instructor: User,
    @GetRealIp() ip: string,
  ) {
    const bundle = await this.bundleService.createBundle(dto, instructor, ip);
    return bundle;
  }

  @Patch('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async updateBundle(
    @Body() dto: UpdateBundleDto,
    @GetUser() instructor: User,
  ) {
    const bundle = await this.bundleService.updateBundle(dto, instructor);
    return bundle;
  }

  @Delete('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async deleteBundle(
    @Body() dto: DeleteBundleDto,
    @GetUser() instructor: User,
  ) {
    const bundle = await this.bundleService.deleteBundle(dto, instructor);
    return bundle;
  }

  @Get('instructor')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Instructor, UserRole.Organization)
  async listInstructorBundles(
    @Query() dto: ListInstructorBundlesDto,
    @GetUser() instructor: User,
    @GetRealIp() ip: string,
  ) {
    const bundles = await this.bundleService.listInstructorBundles(
      dto,
      ip,
      instructor,
    );
    return bundles;
  }

  @Get('')
  async listeBundle(@Query() dto: ListBundlesDto) {
    const bundles = await this.bundleService.listBundles(dto);
    return bundles;
  }

  @Get(':id')
  async getnundleById(@Param() dto: GetBundleByIdDto) {
    const bundles = await this.bundleService.getBundleById(dto);
    return bundles;
  }
}
