import {
  User,
  Thread,
  ThreadFeedback,
  ThreadFeedbackReaction,
} from '@prisma/client';
import {
  Logger,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ListThreadsDto,
  UpdateThreadDto,
  CreateThreadDto,
  DeleteThreadDto,
  ListThreadCommentsDto,
  CreateThreadCommentDto,
  CreateThreadReactionDto,
} from '../forum/forum.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class ForumRepository {
  private exceptionMsg: string;
  private logger = new Logger('ForumRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async createThread(dto: CreateThreadDto) {
    const { title, content, user } = dto;

    try {
      const thread = await this.prisma.thread.create({
        data: { title, content, userId: user.id },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          _count: { select: { comments: true, feedbacks: true } },
          user: { select: { id: true, username: true, profileImage: true } },
        },
      });

      (thread as any).comments = thread._count.comments;
      (thread as any).feedbacks = thread._count.feedbacks;
      delete thread._count;

      return thread;
    } catch (err) {
      this.logger.error('failed to create therad', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateThread(dto: UpdateThreadDto) {
    const { id, user, title, content } = dto;

    let thread: Thread & { user: User };

    try {
      thread = await this.prisma.thread.findFirst({
        where: { id, userId: user.id, deleted: false },
        include: { user: true },
      });
    } catch (err) {
      this.logger.error('failed to create thread', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    if (!thread) {
      if (thread)
        this.logger.warn(
          `Unauthorize user ${user.username} tries to modify thread for ${thread.user.username}.`,
        );
      throw new NotFoundException('Thread not found.');
    }

    try {
      const updatedThread = await this.prisma.thread.update({
        where: { id },
        data: { title, content },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          _count: { select: { comments: true, feedbacks: true } },
          user: { select: { id: true, username: true, profileImage: true } },
        },
      });

      (updatedThread as any).comments = updatedThread._count.comments;
      (updatedThread as any).feedbacks = updatedThread._count.feedbacks;
      delete updatedThread._count;
      return updatedThread;
    } catch (err) {
      this.logger.error('failed to update thread', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async deleteThread(dto: DeleteThreadDto) {
    const { id, user } = dto;

    let thread: Thread & { user: User };

    try {
      thread = await this.prisma.thread.findFirst({
        include: { user: true },
        where: { id, deleted: false },
      });
    } catch (err) {
      this.logger.error('failed to create thread', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    if (!thread || thread.userId !== user.id) {
      if (thread)
        this.logger.warn(
          `unauthorize user ${user.username} tries to delete thread for ${thread.user.username}.`,
        );
      throw new NotFoundException('Thread not found.');
    }

    try {
      await this.prisma.thread.update({
        where: { id },
        data: { deleted: true },
      });

      return { deleted: true };
    } catch (err) {
      this.logger.error('failed to delete thread', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listThreads(dto: ListThreadsDto) {
    const { to, from, page, size, search, onlyOwned } = dto;
    const _to = new Date(new Date(to).setDate(new Date(to).getDate() + 1));

    try {
      const [total, _threads] = await this.prisma.$transaction([
        this.prisma.thread.count({
          where: {
            deleted: false,
            title: { mode: 'insensitive', contains: search },
            createdAt: { lte: to ? _to : undefined, gte: from },
            user:
              onlyOwned && dto.user
                ? { username: dto.user.username }
                : undefined,
          },
        }),
        this.prisma.thread.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            deleted: false,
            title: { mode: 'insensitive', contains: search },
            createdAt: { lte: to ? _to : undefined, gte: from },
            user:
              onlyOwned && dto.user
                ? { username: dto.user.username }
                : undefined,
          },

          select: {
            id: true,
            title: true,
            content: true,
            createdAt: true,
            _count: { select: { comments: true, feedbacks: true } },
            user: { select: { id: true, username: true, profileImage: true } },
          },
        }),
      ]);

      const threads = _threads.map((t) => {
        (t as any).comments = t._count.comments;
        (t as any).feedbacks = t._count.feedbacks;
        delete t._count;

        return t;
      });

      return { total, threads };
    } catch (err) {
      this.logger.error('failed to get threads', err);
      delete dto.user;
      this.logger.debug(JSON.stringify(dto));
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getThreadById(id: number) {
    let thread: Partial<Thread> & {
      _count: { feedbacks: number; comments: number };
      user: { id: number; username: string; profileImage: string };
    };

    try {
      thread = await this.prisma.thread.findFirst({
        where: { id, deleted: false },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          _count: { select: { comments: true, feedbacks: true } },
          user: { select: { id: true, username: true, profileImage: true } },
        },
      });
    } catch (err) {
      this.logger.error('failed to get threads', err);
      this.logger.debug({ threadId: id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    if (!thread) throw new NotFoundException('Thread not found');

    (thread as any).comments = thread._count.comments;
    (thread as any).feedbacks = thread._count.feedbacks;
    delete thread._count;
    return thread;
  }

  async createComment(dto: CreateThreadCommentDto) {
    const { comment, threadId, user } = dto;

    try {
      const threadComment = await this.prisma.threadComment.create({
        data: { threadId, comment, userId: user.id },
        select: { id: true, createdAt: true, comment: true, threadId: true },
      });

      return threadComment;
    } catch (err) {
      this.logger.error('failed to create thread comment', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listComments(dto: ListThreadCommentsDto) {
    const { page, size, threadId } = dto;
    try {
      const [total, comments] = await this.prisma.$transaction([
        this.prisma.threadComment.count({
          where: {
            threadId,
            deleted: false,
          },
        }),
        this.prisma.threadComment.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            threadId,
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
      this.logger.error('failed to list thread comments', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createThreadFeedback(dto: CreateThreadReactionDto) {
    const { threadId, user } = dto;

    try {
      const _feedback = await this.prisma.threadFeedback.create({
        // where: {
        //   userId: user.id,
        //   threadId: threadId,
        //   id: feedback ? feedback.id : -1,
        // },
        // update: { reaction },
        data: {
          threadId,
          userId: user.id,
          reaction: ThreadFeedbackReaction.Like,
        },
        select: { id: true, createdAt: true, reaction: true },
      });
      return _feedback;
    } catch (err) {
      this.logger.error('failed to create thread feedback', err);
      delete dto.user;
      this.logger.debug(JSON.stringify(dto));
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async deleteThreadFeedback(thread: ThreadFeedback) {
    try {
      await this.prisma.threadFeedback.delete({
        where: { id: thread.id },
      });
    } catch (err) {
      this.logger.error('failed to delete thread feedback', err);
      this.logger.debug({ id: thread.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getThreadFeedbackByUser(threadId: number, user: User) {
    try {
      const feedback = await this.prisma.threadFeedback.findFirst({
        where: { threadId, userId: user.id },
      });
      return feedback;
    } catch (err) {
      this.logger.error(
        'failed to get thread feedback by user and threadId. ',
        err,
      );
      this.logger.debug({ threadId: threadId, userId: user.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
