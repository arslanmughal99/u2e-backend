import { User, UserRole } from '@prisma/client';
import { Get, Inject, UseGuards, Controller, Query } from '@nestjs/common';

import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';
import { UPLOAD_SERVICE, UploadService } from './upload.port';

@Controller('upload')
export class UploadController {
  constructor(@Inject(UPLOAD_SERVICE) private uploadService: UploadService) {}

  @Get('/profile-image')
  @UseGuards(JwtAuthGuard)
  getImageUploadSignature(
    @GetUser() user: User,
    @Query('filename') filename?: string,
  ) {
    const res = this.uploadService.createUserProfileImageUploadSignature(
      user,
      filename,
    );
    return res;
  }

  // @Get('/lecture-video')
  // @UseGuards(JwtAuthGuard, RoleGuard)
  // @Roles(UserRole.Instructor, UserRole.Organization)
  // getVideoUploadSignature(
  //   @GetUser() user: User,
  //   @Query('filename') filename?: string,
  // ) {
  //   const res = this.uploadService.createVideoUploadSignature(user, filename);
  //   return res;
  // }

  // @Get('/attachments')
  // @UseGuards(JwtAuthGuard)
  // getAttachmentsUploadSignature(
  //   @GetUser() user: User,
  //   @Query('filename') filename?: string,
  // ) {
  //   const res = this.uploadService.createAttachmentsUploadSignature(
  //     user,
  //     filename,
  //   );
  //   return res;
  // }
}
