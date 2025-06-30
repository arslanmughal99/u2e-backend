import {
  Get,
  Body,
  Post,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

import {
  AdminListBlogsDto,
  AdminUpdateBlogDto,
  AdminCreateBlogDto,
  AdminGetBlogByIdDto,
  AdminDeleteBlogByIdDto,
} from './dto/blog.dto';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminBlogService } from './blog.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('admin/blog')
@UseGuards(JwtAuthGuard, RoleGuard)
export class BlogController {
  constructor(private blogService: AdminBlogService) {}

  @Post()
  @Roles(UserRole.Admin)
  async createBlog(@Body() dto: AdminCreateBlogDto, @GetUser() admin: User) {
    dto.admin = admin;
    const res = await this.blogService.createBlog(dto);
    return res;
  }

  @Patch()
  @Roles(UserRole.Admin)
  async updateBlog(@Body() dto: AdminUpdateBlogDto) {
    const res = await this.blogService.updateBlog(dto);
    return res;
  }

  @Get()
  @Roles(UserRole.Admin)
  async listBlogs(@Query() dto: AdminListBlogsDto) {
    const res = await this.blogService.listBlogs(dto);
    return res;
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  async getBlogById(@Param() dto: AdminGetBlogByIdDto) {
    const res = await this.blogService.getBlogById(dto);
    return res;
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  async deleteBlogById(@Param() dto: AdminDeleteBlogByIdDto) {
    const res = await this.blogService.deleteBlogById(dto);
    return res;
  }
}
