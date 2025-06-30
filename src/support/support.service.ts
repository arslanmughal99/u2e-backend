import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatus, TicketType } from '@prisma/client';

import {
  UpdateTicketDto,
  CreateTicketDto,
  ListUserTicketsDto,
  ListTicketCommentsDto,
  CreateTicketCommentDto,
  ListInstructorTicketsDto,
} from './support.dto';
import { AttachmentWithName } from '../upload/upload.dto';
import { TicketRepository } from '../repository/ticket.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

@Injectable()
export class SupportService {
  constructor(
    private ticketRepository: TicketRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async createTicket(dto: CreateTicketDto) {
    const { comment, attachments } = dto;

    if (dto.attachments) {
      const atchVerf = await Promise.all(
        dto.attachments.map(async (a) => {
          return {
            name: a.name,
            verified: await this.uploadService.verifySupportAttachmentUpload(
              a.id,
            ),
          };
        }),
      );

      const failed = atchVerf
        .filter((a) => a.verified === false)
        .map((a) => a.name);
      if (failed.length > 0)
        throw new NotFoundException('Attachment(s) not found.');
    }

    const ticket = await this.ticketRepository.createTicket(dto);
    await this.ticketRepository.createTicketComment({
      comment,
      attachments,
      user: dto.user,
      ticketId: ticket.id,
    });

    if (ticket.course) {
      ticket.course.thumbnail = this.uploadService.createCourseThumbnailLink(
        ticket.course.thumbnail,
      );

      if (ticket.course.instructor.profileImage)
        ticket.course.instructor.profileImage =
          this.uploadService.createUserProfileLink(
            ticket.course.instructor.profileImage,
          );
    }

    if (ticket.type === TicketType.Platform) delete ticket.course;

    return ticket;
  }

  async createTicketComment(dto: CreateTicketCommentDto) {
    if (dto.attachments) {
      const atchVerf = await Promise.all(
        dto.attachments.map(async (a) => {
          return {
            name: a.name,
            verified: await this.uploadService.verifySupportAttachmentUpload(
              a.id,
            ),
          };
        }),
      );

      const failed = atchVerf
        .filter((a) => a.verified === false)
        .map((a) => a.name);
      if (failed.length > 0)
        throw new NotFoundException('Attachment(s) not found.');
    }

    const ticket = await this.ticketRepository.getTicketById(dto.ticketId);

    if (!ticket) throw new NotFoundException('Ticket not found .');

    if (
      ticket.userId !== dto.user.id &&
      ticket.type === TicketType.Course &&
      ticket.course.instructor.id !== dto.user.id
    )
      throw new NotFoundException('Ticket not found.');

    if (ticket.status === TicketStatus.Closed)
      throw new ConflictException('Ticket is closed');

    const comment = await this.ticketRepository.createTicketComment(dto);

    if (comment.attachments)
      comment.attachments = await Promise.all(
        (comment.attachments as unknown as AttachmentWithName[]).map(
          async (a) => ({
            id: a.id,
            name: a.name,
            url: await this.uploadService.createSupportAttachmentLink(a.id),
          }),
        ),
      );

    if (comment.user.profileImage)
      comment.user.profileImage = this.uploadService.createUserProfileLink(
        comment.user.profileImage,
      );

    return comment;
  }

  async listUserTickets(dto: ListUserTicketsDto) {
    const t = await this.ticketRepository.listUserTickets(dto);

    t.tickets = t.tickets.map((ticket) => {
      if (ticket.type === TicketType.Course) {
        ticket.course.thumbnail = this.uploadService.createCourseThumbnailLink(
          ticket.course.thumbnail,
        );

        if (ticket.course.instructor.profileImage)
          ticket.course.instructor.profileImage =
            this.uploadService.createUserProfileLink(
              ticket.course.instructor.profileImage,
            );
      } else {
        delete ticket.course;
      }

      return ticket;
    });

    return t;
  }

  async listInstructorTickets(dto: ListInstructorTicketsDto) {
    const t = await this.ticketRepository.listInstructorTickets(dto);

    t.tickets = t.tickets.map((ticket) => {
      ticket.course.thumbnail = this.uploadService.createCourseThumbnailLink(
        ticket.course.thumbnail,
      );
      if (ticket.user.profileImage)
        ticket.user.profileImage = this.uploadService.createUserProfileLink(
          ticket.user.profileImage,
        );

      return ticket;
    });

    return t;
  }

  async listTicketComments(dto: ListTicketCommentsDto) {
    const { ticketId, user } = dto;
    const ticket = await this.ticketRepository.getTicketById(ticketId);

    if (!ticket) throw new NotFoundException('Ticket not found .');

    if (
      ticket.userId !== user.id &&
      ticket.type === TicketType.Course &&
      ticket.course.instructor.id !== user.id
    )
      throw new NotFoundException('Ticket not found.');

    const c = await this.ticketRepository.listTicketComments(dto);

    c.comments = await Promise.all(
      c.comments.map(async (comment) => {
        if (comment.attachments)
          comment.attachments = await Promise.all(
            (comment.attachments as unknown as AttachmentWithName[]).map(
              async (a) => ({
                id: a.id,
                name: a.name,
                url: await this.uploadService.createSupportAttachmentLink(a.id),
              }),
            ),
          );

        if (comment.user.profileImage)
          comment.user.profileImage =
            await this.uploadService.createSupportAttachmentLink(
              comment.user.profileImage,
            );

        return comment;
      }),
    );

    return c;
  }

  async updateInstructorTicket(dto: UpdateTicketDto) {
    const { user, status, ticketId } = dto;
    const ticket = await this.ticketRepository.getTicketById(ticketId);

    if (!ticket || ticket.type === TicketType.Platform)
      throw new NotFoundException('Ticket not found .');

    if (
      ticket.type !== TicketType.Course &&
      ticket.course.instructor.id !== user.id
    )
      throw new NotFoundException('Ticket not found.');

    const updated = await this.ticketRepository.updateTicket(ticket.id, status);

    return updated;
  }
}
