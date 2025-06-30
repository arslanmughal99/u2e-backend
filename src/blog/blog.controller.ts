import {
  Get,
  Body,
  Post,
  Param,
  Query,
  Delete,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { UserRole, User } from '@prisma/client';

import {
  ListBlogsDto,
  GetBlogByIdDto,
  ListBlogCommentsDto,
  CreateBlogCommentDto,
  CreateBlogReactionDto,
  DeleteBlogReactionDto,
} from './blog.dto';
import { BlogService } from './blog.service';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('blog')
export class BlogController {
  constructor(private forumService: BlogService) {}

  @Get()
  async listBlogs(@Query() dto: ListBlogsDto) {
    const res = await this.forumService.listBlogs(dto);
    return res;
  }

  @Get('comment')
  async listBlogsComments(@Query() dto: ListBlogCommentsDto) {
    const res = await this.forumService.listComments(dto);
    return res;
  }

  @Post('comment')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Organization, UserRole.Instructor)
  async createBlogComment(
    @GetUser() user: User,
    @Body() dto: CreateBlogCommentDto,
  ) {
    dto.user = user;
    const res = await this.forumService.createBlogComment(dto);
    return res;
  }

  @Post('feedback')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Organization, UserRole.Instructor)
  async createFeedback(
    @GetUser() user: User,
    @Body() dto: CreateBlogReactionDto,
  ) {
    dto.user = user;
    const res = await this.forumService.createBlogFeedback(dto);
    return res;
  }

  @Delete('feedback')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Organization, UserRole.Instructor)
  async deleteFeedback(
    @GetUser() user: User,
    @Body() dto: DeleteBlogReactionDto,
  ) {
    dto.user = user;
    const res = await this.forumService.deleteBlogFeedback(dto);
    return res;
  }

  @Get(':id')
  async getBlogById(@Param() dto: GetBlogByIdDto) {
    const res = await this.forumService.getBlogById(dto);
    return res;
  }
}
