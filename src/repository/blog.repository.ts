import {
  Logger,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Blog, BlogFeedback, BlogFeedbackReaction, User } from '@prisma/client';

import {
  ListBlogsDto,
  ListBlogCommentsDto,
  CreateBlogCommentDto,
  CreateBlogReactionDto,
} from '../blog/blog.dto';
import {
  AdminListBlogsDto,
  AdminUpdateBlogDto,
  AdminCreateBlogDto,
} from '../admin/dto/blog.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class BlogRepository {
  private exceptionMsg: string;
  private logger = new Logger('BlogRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async listBlogs(dto: ListBlogsDto) {
    const { to, from, page, size, categoryId, search } = dto;
    const _to = new Date(new Date(to).setDate(new Date(to).getDate() + 1));

    try {
      const [total, _blogs] = await this.prisma.$transaction([
        this.prisma.blog.count({
          where: {
            categoryId,
            deleted: false,
            title: { mode: 'insensitive', contains: search },
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
        }),
        this.prisma.blog.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            categoryId,
            deleted: false,
            title: { mode: 'insensitive', contains: search },
            createdAt: { lte: to ? _to : undefined, gte: from },
          },

          select: {
            id: true,
            image: true,
            title: true,
            content: true,
            createdAt: true,
            _count: { select: { comments: true, feedbacks: true } },
            category: { select: { id: true, icon: true, title: true } },
            user: { select: { id: true, username: true, profileImage: true } },
          },
        }),
      ]);

      const blogs = _blogs.map((t) => {
        (t as any).comments = t._count.comments;
        (t as any).feedbacks = t._count.feedbacks;
        delete t._count;

        return t;
      });

      return { total, blogs };
    } catch (err) {
      this.logger.error('failed to get blogs', err);
      delete dto.user;
      this.logger.debug(JSON.stringify(dto));
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getBlogById(id: number) {
    let blog: Partial<Blog> & {
      _count: { feedbacks: number; comments: number };
      category: { id: number; icon: string; title: string };
      user: { id: number; username: string; profileImage: string };
    };

    try {
      blog = await this.prisma.blog.findFirst({
        where: { id, deleted: false },
        select: {
          id: true,
          image: true,
          title: true,
          content: true,
          createdAt: true,
          category: { select: { id: true, icon: true, title: true } },
          _count: { select: { comments: true, feedbacks: true } },
          user: { select: { id: true, username: true, profileImage: true } },
        },
      });
    } catch (err) {
      this.logger.error('failed to get blogs', err);
      this.logger.debug({ blogId: id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    if (!blog) throw new NotFoundException('Blog not found');

    (blog as any).comments = blog._count.comments;
    (blog as any).feedbacks = blog._count.feedbacks;
    delete blog._count;
    return blog;
  }

  async createComment(dto: CreateBlogCommentDto) {
    const { comment, blogId, user } = dto;

    try {
      const blogComment = await this.prisma.blogComment.create({
        data: { blogId, comment, userId: user.id },
        select: { id: true, createdAt: true, comment: true, blogId: true },
      });

      return blogComment;
    } catch (err) {
      this.logger.error('failed to create blog comment', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listComments(dto: ListBlogCommentsDto) {
    const { page, size, blogId } = dto;
    try {
      const [total, comments] = await this.prisma.$transaction([
        this.prisma.blogComment.count({
          where: {
            blogId,
            deleted: false,
          },
        }),
        this.prisma.blogComment.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            blogId,
            deleted: false,
          },
          select: {
            id: true,
            comment: true,
            createdAt: true,
            user: { select: { id: true, username: true, profileImage: true } },
          },
        }),
      ]);

      return { total, comments };
    } catch (err) {
      this.logger.error('failed to list blog comments', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createBlogFeedback(dto: CreateBlogReactionDto) {
    const { blogId, user } = dto;

    try {
      const _feedback = await this.prisma.blogFeedback.create({
        // where: {
        //   userId: user.id,
        //   blogId: blogId,
        //   id: feedback ? feedback.id : -1,
        // },
        // update: { reaction },
        data: {
          blogId,
          userId: user.id,
          reaction: BlogFeedbackReaction.Like,
        },
        select: { id: true, createdAt: true, reaction: true },
      });
      return _feedback;
    } catch (err) {
      this.logger.error('failed to create blog feedback', err);
      delete dto.user;
      this.logger.debug(JSON.stringify(dto));
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async deleteBlogFeedback(blog: BlogFeedback) {
    try {
      await this.prisma.blogFeedback.delete({
        where: { id: blog.id },
      });
    } catch (err) {
      this.logger.error('failed to delete blog feedback', err);
      this.logger.debug({ id: blog.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getBlogFeedbackByUser(blogId: number, user: User) {
    try {
      const feedback = await this.prisma.blogFeedback.findFirst({
        where: { blogId, userId: user.id },
      });
      return feedback;
    } catch (err) {
      this.logger.error(
        'failed to get blog feedback by user and blogId. ',
        err,
      );
      this.logger.debug({ blogId: blogId, userId: user.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createBlogAdmin(dto: AdminCreateBlogDto) {
    const { admin, title, image, content, categoryId } = dto;

    try {
      const blog = await this.prisma.blog.create({
        data: { title, image, content, userId: admin.id, categoryId },
        select: {
          id: true,
          title: true,
          image: true,
          content: true,
          createdAt: true,
          category: { select: { id: true, title: true, icon: true } },
          user: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
      });

      return blog;
    } catch (err) {
      this.logger.error('failed to create blog', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateBlogAdmin(dto: AdminUpdateBlogDto) {
    const { id, title, image, content, categoryId } = dto;

    try {
      const blog = await this.prisma.blog.update({
        where: { id, deleted: false },
        data: { title, image, content, categoryId },
        select: {
          id: true,
          title: true,
          image: true,
          content: true,
          createdAt: true,
          category: { select: { id: true, title: true, icon: true } },
          user: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
      });

      return blog;
    } catch (err) {
      this.logger.error('failed to update blog', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listBlogsAdmin(dto: AdminListBlogsDto) {
    const { to, from, page, size, categoryId, search } = dto;
    const _to = new Date(new Date(to).setDate(new Date(to).getDate() + 1));

    try {
      const [total, _blogs] = await this.prisma.$transaction([
        this.prisma.blog.count({
          where: {
            categoryId,
            deleted: false,
            title: { mode: 'insensitive', contains: search },
            createdAt: { lte: to ? _to : undefined, gte: from },
          },
        }),
        this.prisma.blog.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            categoryId,
            deleted: false,
            title: { mode: 'insensitive', contains: search },
            createdAt: { lte: to ? _to : undefined, gte: from },
          },

          select: {
            id: true,
            image: true,
            title: true,
            content: true,
            createdAt: true,
            _count: { select: { comments: true, feedbacks: true } },
            category: { select: { id: true, icon: true, title: true } },
            user: { select: { id: true, username: true, profileImage: true } },
          },
        }),
      ]);

      const blogs = _blogs.map((t) => {
        (t as any).comments = t._count.comments;
        (t as any).feedbacks = t._count.feedbacks;
        delete t._count;

        return t;
      });

      return { total, blogs };
    } catch (err) {
      this.logger.error('failed to get blogs for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getBlogByIdAdmin(id: number) {
    try {
      const blog = await this.prisma.blog.findFirst({
        where: {
          id,
          deleted: false,
        },

        select: {
          id: true,
          image: true,
          title: true,
          content: true,
          createdAt: true,
          _count: { select: { comments: true, feedbacks: true } },
          category: { select: { id: true, icon: true, title: true } },
          user: { select: { id: true, username: true, profileImage: true } },
        },
      });
      return blog;
    } catch (err) {
      this.logger.error('failed to get blog by id for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async deleteBlogByIdAdmin(id: number) {
    try {
      const blog = await this.prisma.blog.update({
        where: { id },
        data: { deleted: true },
      });

      return { id: blog.id, deleted: blog.deleted };
    } catch (err) {
      this.logger.error('failed to delete blog by admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
