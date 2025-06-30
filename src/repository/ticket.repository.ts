import {
  Logger,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketStatus, TicketType } from '@prisma/client';

import {
  CreateTicketDto,
  ListUserTicketsDto,
  ListTicketCommentsDto,
  CreateTicketCommentDto,
  ListInstructorTicketsDto,
} from '../support/support.dto';
import {
  AdminListTicketsDto,
  AdminUpdateTicketDto,
  AdminListTicketCommentsDto,
  AdminCreateTicketCommentDto,
} from '../admin/dto/support.dto';
import { PrismaService } from './prisma.service';
import { CourseRepository } from './course.repository';

@Injectable()
export class TicketRepository {
  private exceptionMsg: string;
  private logger = new Logger('TicketRepository');
  constructor(
    private prisma: PrismaService,
    private configs: ConfigService,
    private courseRepository: CourseRepository,
  ) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async createTicket(dto: Partial<CreateTicketDto>) {
    const { user, subject, courseId, type: ticketType } = dto;
    if (courseId && ticketType === TicketType.Course) {
      const course = await this.courseRepository.getCourseById(courseId);
      if (!course) throw new NotFoundException('Course not found.');
    }

    try {
      const ticket = await this.prisma.ticket.create({
        data: {
          subject,
          type: ticketType,
          userId: user.id,
          courseId: ticketType === TicketType.Course ? courseId : undefined,
        },
        select: {
          id: true,
          type: true,
          status: true,
          subject: true,
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              instructor: {
                select: { id: true, username: true, profileImage: true },
              },
            },
          },
        },
      });
      return ticket;
    } catch (err) {
      this.logger.error('failed to create ticket', err);
      delete dto.user;
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createTicketComment(dto: CreateTicketCommentDto) {
    const { comment, ticketId, attachments, user } = dto;

    try {
      const _comment = await this.prisma.ticketComment.create({
        data: {
          comment,
          ticketId,
          userId: user.id,
          attachments: attachments?.map((a) => ({ id: a.id, name: a.name })),
        },
        select: {
          id: true,
          comment: true,
          createdAt: true,
          attachments: true,
          user: { select: { id: true, profileImage: true, username: true } },
        },
      });
      return _comment;
    } catch (err) {
      this.logger.error('failed to create ticket comment', err);
      delete dto.user;
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getTicketById(id: number) {
    try {
      const ticket = await this.prisma.ticket.findFirst({
        where: { id },
        select: {
          id: true,
          type: true,
          userId: true,
          status: true,
          subject: true,
          user: { select: { id: true, username: true, profileImage: true } },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              instructor: {
                select: { id: true, username: true, profileImage: true },
              },
            },
          },
        },
      });
      return ticket;
    } catch (err) {
      this.logger.error('failed to get ticket by id.', err);
      this.logger.debug({ ticketId: id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listUserTickets(dto: ListUserTicketsDto) {
    const { page, size, user, search, status } = dto;

    try {
      const [total, tickets] = await this.prisma.$transaction([
        this.prisma.ticket.count({
          where: {
            status,
            deleted: false,
            userId: user.id,
            subject: search ? { contains: search } : undefined,
          },
        }),
        this.prisma.ticket.findMany({
          take: size,
          orderBy: { id: 'desc' },
          skip: (page - 1) * size,
          select: {
            id: true,
            type: true,
            status: true,
            subject: true,
            createdAt: true,
            // user: { select: { id: true, username: true, profileImage: true } },
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                instructor: {
                  select: { id: true, username: true, profileImage: true },
                },
              },
            },
          },
          where: {
            status,
            deleted: false,
            userId: user.id,
            subject: search ? { contains: search } : undefined,
          },
        }),
      ]);

      return { total, tickets };
    } catch (err) {
      this.logger.error('failed to get user tickets', err);
      delete dto.user;
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listInstructorTickets(dto: ListInstructorTicketsDto) {
    const { page, size, user, search, status } = dto;

    try {
      const [total, tickets] = await this.prisma.$transaction([
        this.prisma.ticket.count({
          where: {
            status,
            deleted: false,
            type: TicketType.Course,
            course: { instructorId: user.id },
            subject: search ? { contains: search } : undefined,
          },
        }),
        this.prisma.ticket.findMany({
          take: size,
          orderBy: { id: 'desc' },
          skip: (page - 1) * size,
          select: {
            id: true,
            type: true,
            status: true,
            subject: true,
            createdAt: true,
            user: { select: { id: true, username: true, profileImage: true } },
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
              },
            },
          },
          where: {
            status,
            deleted: false,
            type: TicketType.Course,
            course: { instructorId: user.id },
            subject: search ? { contains: search } : undefined,
          },
        }),
      ]);

      return { total, tickets };
    } catch (err) {
      this.logger.error('failed to get instructor tickets', err);
      delete dto.user;
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateTicket(ticketId: number, status: TicketStatus) {
    try {
      const ticket = await this.prisma.ticket.update({
        data: { status },
        select: {
          id: true,
          type: true,
          status: true,
          subject: true,
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              instructor: {
                select: { id: true, username: true, profileImage: true },
              },
            },
          },
        },
        where: { id: ticketId },
      });
      return ticket;
    } catch (err) {
      this.logger.error('failed to update ticket.', err);
      this.logger.debug({ ticketId, status });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listTicketComments(dto: ListTicketCommentsDto) {
    const { page, size, ticketId } = dto;
    const [total, comments] = await this.prisma.$transaction([
      this.prisma.ticketComment.count({
        where: { ticketId, deleted: false },
      }),
      this.prisma.ticketComment.findMany({
        take: size,
        orderBy: { id: 'desc' },
        skip: (page - 1) * size,
        where: {
          ticketId,
          deleted: false,
        },
        select: {
          id: true,
          comment: true,
          createdAt: true,
          attachments: true,
          user: { select: { id: true, profileImage: true, username: true } },
        },
      }),
    ]);

    return { total, comments };
  }

  async listAdminTickets(dto: AdminListTicketsDto) {
    const { page, size, search, status, to, from, userId } = dto;
    const _to = new Date(new Date(to).setDate(new Date(to).getDate() + 1));

    try {
      const [total, tickets] = await this.prisma.$transaction([
        this.prisma.ticket.count({
          where: {
            status,
            userId,
            deleted: false,
            type: TicketType.Platform,
            createdAt: { lte: to ? _to : undefined, gte: from },
            subject: search
              ? { contains: search, mode: 'insensitive' }
              : undefined,
          },
        }),
        this.prisma.ticket.findMany({
          take: size,
          orderBy: { id: 'desc' },
          skip: (page - 1) * size,
          select: {
            id: true,
            type: true,
            status: true,
            subject: true,
            createdAt: true,
            user: { select: { id: true, username: true, profileImage: true } },
            // course: {
            //   select: {
            //     id: true,
            //     title: true,
            //     thumbnail: true,
            //   },
            // },
          },
          where: {
            status,
            userId,
            deleted: false,
            type: TicketType.Platform,
            createdAt: { lte: to ? _to : undefined, gte: from },
            subject: search
              ? { contains: search, mode: 'insensitive' }
              : undefined,
          },
        }),
      ]);

      return { total, tickets };
    } catch (err) {
      this.logger.error('failed to get admin tickets', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getPlatformTicketById(id: number) {
    try {
      const ticket = await this.prisma.ticket.findFirst({
        where: { deleted: false, id, type: TicketType.Platform },
        select: {
          id: true,
          type: true,
          userId: true,
          status: true,
          subject: true,
          user: { select: { id: true, username: true, profileImage: true } },
        },
      });
      return ticket;
    } catch (err) {
      this.logger.error('failed to get platform ticket by id', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateTicketAdmin(dto: AdminUpdateTicketDto) {
    const { id, status } = dto;

    try {
      const ticket = await this.prisma.ticket.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          type: true,
          userId: true,
          status: true,
          subject: true,
          user: { select: { id: true, username: true, profileImage: true } },
        },
      });

      return ticket;
    } catch (err) {
      this.logger.error('failed update ticket by admin', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listPlatformTicketComments(dto: AdminListTicketCommentsDto) {
    const { page, size, ticketId } = dto;

    try {
      const [total, comments] = await this.prisma.$transaction([
        this.prisma.ticketComment.count({
          where: {
            ticketId,
            deleted: false,
            ticket: { type: TicketType.Platform },
          },
        }),
        this.prisma.ticketComment.findMany({
          take: size,
          orderBy: { id: 'desc' },
          skip: (page - 1) * size,
          where: {
            ticketId,
            deleted: false,
            ticket: { type: TicketType.Platform },
          },
          select: {
            id: true,
            comment: true,
            createdAt: true,
            attachments: true,
            user: { select: { id: true, profileImage: true, username: true } },
          },
        }),
      ]);

      return { total, comments };
    } catch (err) {
      this.logger.error('failed to list platform tickets for admin', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createPlatformTicketComment(dto: AdminCreateTicketCommentDto) {
    const { comment, ticketId, attachments, user } = dto;

    try {
      const _comment = await this.prisma.ticketComment.create({
        data: {
          comment,
          ticketId,
          userId: user.id,
          attachments: attachments.map((a) => ({ id: a.id, name: a.name })),
        },
        select: {
          id: true,
          comment: true,
          createdAt: true,
          attachments: true,
          user: { select: { id: true, profileImage: true, username: true } },
        },
      });
      return _comment;
    } catch (err) {
      this.logger.error('failed to create platform ticket comment', err);
      delete dto.user;
      this.logger.debug(JSON.stringify(dto, undefined, 2));
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
