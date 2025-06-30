import {
  Get,
  Post,
  Body,
  Query,
  Param,
  Patch,
  Delete,
  Headers,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';

import {
  ListThreadsDto,
  CreateThreadDto,
  DeleteThreadDto,
  UpdateThreadDto,
  GetThreadByIdDto,
  ListThreadCommentsDto,
  CreateThreadCommentDto,
  CreateThreadReactionDto,
  DeleteThreadReactionDto,
} from './forum.dto';
import { ForumService } from './forum.service';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { GetUser } from '../auth/get-user.decorator';

@Controller('forum/thread')
export class ForumController {
  constructor(private forumService: ForumService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Organization, UserRole.Instructor)
  async createPost(@Body() dto: CreateThreadDto, @GetUser() user: User) {
    dto.user = user;
    const res = await this.forumService.createThread(dto);
    return res;
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Organization, UserRole.Instructor)
  async updatePost(@Body() dto: UpdateThreadDto, @GetUser() user: User) {
    dto.user = user;
    const res = await this.forumService.updateThread(dto);
    return res;
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Organization, UserRole.Instructor)
  async deletePost(@Body() dto: DeleteThreadDto, @GetUser() user: User) {
    dto.user = user;
    const res = await this.forumService.deleteThread(dto);
    return res;
  }

  @Get()
  async listThreads(
    @Query() dto: ListThreadsDto,
    @Headers('Authorization')
    authToken?: string,
  ) {
    const res = await this.forumService.listThreads(dto, authToken);
    return res;
  }

  @Get('comment')
  async listThreadsComments(@Query() dto: ListThreadCommentsDto) {
    const res = await this.forumService.listComments(dto);
    return res;
  }

  @Post('comment')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Organization, UserRole.Instructor)
  async createThreadComment(
    @GetUser() user: User,
    @Body() dto: CreateThreadCommentDto,
  ) {
    dto.user = user;
    const res = await this.forumService.createThreadComment(dto);
    return res;
  }

  @Post('feedback')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Organization, UserRole.Instructor)
  async createFeedback(
    @GetUser() user: User,
    @Body() dto: CreateThreadReactionDto,
  ) {
    dto.user = user;
    const res = await this.forumService.createThreadFeedback(dto);
    return res;
  }

  @Delete('feedback')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.Organization, UserRole.Instructor)
  async deleteFeedback(
    @GetUser() user: User,
    @Body() dto: DeleteThreadReactionDto,
  ) {
    dto.user = user;
    const res = await this.forumService.deleteThreadFeedback(dto);
    return res;
  }

  @Get(':id')
  async getThreadById(@Param() dto: GetThreadByIdDto) {
    const res = await this.forumService.getThreadById(dto);
    return res;
  }
}
