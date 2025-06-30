import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  AdminListTicketsDto,
  AdminUpdateTicketDto,
  AdminGetTicketByIdDto,
  AdminListTicketCommentsDto,
  AdminCreateTicketCommentDto,
} from './dto/support.dto';
import { AttachmentWithName } from '../upload/upload.dto';
import { TicketRepository } from '../repository/ticket.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

@Injectable()
export class AdminSupportService {
  constructor(
    private ticketRepository: TicketRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async listTickets(dto: AdminListTicketsDto) {
    const t = await this.ticketRepository.listAdminTickets(dto);

    t.tickets = t.tickets.map((ticket) => {
      //   ticket.course.thumbnail = this.uploadService.createAssetLink({
      //     publicId: ticket.course.thumbnail,
      //   });
      if (ticket.user.profileImage)
        ticket.user.profileImage = this.uploadService.createUserProfileLink(
          ticket.user.profileImage,
        );

      return ticket;
    });

    return t;
  }

  async getTicketById(dto: AdminGetTicketByIdDto) {
    const { id } = dto;
    const ticket = await this.ticketRepository.getPlatformTicketById(id);
    if (!ticket) throw new NotFoundException('Ticket not found.');
    if (ticket.user.profileImage)
      ticket.user.profileImage = this.uploadService.createUserProfileLink(
        ticket.user.profileImage,
      );

    return ticket;
  }

  async updateTicket(dto: AdminUpdateTicketDto) {
    const { id } = dto;
    const exist = await this.ticketRepository.getPlatformTicketById(id);
    if (!exist) throw new NotFoundException('Ticket not found.');

    const ticket = await this.ticketRepository.updateTicketAdmin(dto);
    if (ticket.user.profileImage)
      ticket.user.profileImage = this.uploadService.createUserProfileLink(
        ticket.user.profileImage,
      );

    return ticket;
  }

  async listTicketComments(dto: AdminListTicketCommentsDto) {
    const { ticketId } = dto;
    const ticket = await this.ticketRepository.getTicketById(ticketId);

    if (!ticket) throw new NotFoundException('Ticket not found.');

    const c = await this.ticketRepository.listPlatformTicketComments(dto);

    c.comments = c.comments.map((comment) => {
      if (comment.attachments)
        (comment.attachments as any) = (
          comment.attachments as unknown as AttachmentWithName[]
        ).map((a) => ({
          id: a.id,
          name: a.name,
          url: this.uploadService.createSupportAttachmentLink(a.id),
        }));

      if (comment.user.profileImage)
        comment.user.profileImage = this.uploadService.createUserProfileLink(
          comment.user.profileImage,
        );

      return comment;
    });

    return c;
  }

  async createPlatformTicketComment(dto: AdminCreateTicketCommentDto) {
    const { ticketId, ip, attachments } = dto;

    if (attachments) {
      // const error = await this.uploadService.verifyAttachmentsUpload(
      //   ...attachments,
      // );
      // if (typeof error === 'string')
      //   throw new NotFoundException('Attachment(s) not found.');
      const atchVerf = await Promise.all(
        dto.attachments.map(async (a) => {
          return {
            name: a.name,
            verified: await this.uploadService.verifyLectureAttachmentUpload(
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

    const exist = await this.ticketRepository.getPlatformTicketById(ticketId);
    if (!exist) throw new NotFoundException('Ticket not found.');

    const comment = await this.ticketRepository.createPlatformTicketComment(
      dto,
    );
    if (comment.attachments)
      (comment.attachments as any) = (
        comment.attachments as unknown as AttachmentWithName[]
      ).map((a) => ({
        id: a.id,
        name: a.name,
        url: this.uploadService.createSupportAttachmentLink(a.id),
      }));

    if (comment.user.profileImage)
      comment.user.profileImage = this.uploadService.createUserProfileLink(
        comment.user.profileImage,
      );

    return comment;
  }
}
