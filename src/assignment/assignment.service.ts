import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentStatus } from '@prisma/client';

import {
  ReplyAssignmentDto,
  ListUserAssignmentDto,
  ListAssignmentCommentsDto,
  UpdateActiveAssignmentDto,
  GetUserActiveAssignmentById,
  ListInstructorActiveAssignmentDto,
} from './assignment.dto';
import { AttachmentWithName } from '../upload/upload.dto';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';
import { AssignmentRepository } from '../repository/assignment.repository';

@Injectable()
export class AssignmentService {
  constructor(
    private assignmentRepository: AssignmentRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async createAssignmentReply(dto: ReplyAssignmentDto) {
    const { assignmentId, user, message, attachments } = dto;
    const assignment =
      await this.assignmentRepository.getActiveAsssignmentByOwners({
        id: assignmentId,
        user,
      });

    if (!assignment) throw new NotFoundException('Assignment not found.');
    if (assignment.status === AssignmentStatus.Passed)
      throw new ConflictException('Assignment is already completed');

    if (attachments && attachments.length > 0) {
      const atchVerf = await Promise.all(
        dto.attachments.map(async (a) => {
          return {
            name: a.name,
            verified:
              await this.uploadService.verifyAssignmentReplyAttachmentUpload(
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

    const reply = await this.assignmentRepository.createActiveAssignmentReply({
      user,
      message,
      attachments,
      activeAssignment: assignment,
    });

    if (attachments && attachments.length > 0) {
      (reply as any).attachments = await Promise.all(
        (reply.attachments as unknown as AttachmentWithName[]).map(
          async (a) => ({
            id: a.id,
            name: a.name,
            url: await this.uploadService.createAssignmentReplyAttachmentLink(
              a.id,
            ),
          }),
        ),
      );
    }

    reply.user.profileImage = await this.uploadService.createUserProfileLink(
      reply.user.profileImage,
    );

    // Change status of active assignment to submit on first message of student .
    if (
      assignment.userId === user.id &&
      assignment.status !== AssignmentStatus.Submited
    )
      await this.assignmentRepository.updateActiveAssignmentStatus(
        assignmentId,
        AssignmentStatus.Submited,
      );

    return reply;
  }

  async listUserAssignment(dto: ListUserAssignmentDto) {
    const a = await this.assignmentRepository.listUserActiveAssignments(dto);
    a.assignments = await Promise.all(
      a.assignments.map(async (asi) => {
        asi.assignment.lecture.thumbnail =
          this.uploadService.createLectureThumbnailLink(
            asi.assignment.lecture.thumbnail,
          );
        asi.assignment.attachments = await Promise.all(
          asi.assignment.attachments.map(
            async (atach: { id: string; name: string }) => {
              (atach as any).url =
                await this.uploadService.createLectureAssignmentAttachmentLink(
                  atach.id,
                );
              delete atach.id;

              return atach;
            },
          ),
        );

        return asi;
      }),
    );
    return a;
  }

  async listInstructorActiveAssignment(dto: ListInstructorActiveAssignmentDto) {
    const a = await this.assignmentRepository.listInstructorActiveAssignments(
      dto,
    );

    return a;
  }

  async getUserActiveAssignmentById(dto: GetUserActiveAssignmentById) {
    const assignment =
      await this.assignmentRepository.getUserActiveAssignmentById(dto);

    if (!assignment) throw new NotFoundException('Assignment not found.');

    if (assignment.assignment.attachments) {
      assignment.assignment.attachments = await Promise.all(
        (
          assignment.assignment.attachments as unknown as AttachmentWithName[]
        ).map(async (a) => ({
          id: a.id,
          name: a.name,
          url: await this.uploadService.createLectureAssignmentAttachmentLink(
            a.id,
          ),
        })),
      );
    }

    return assignment;
  }

  async getInstructorActiveAssignmentById(dto: GetUserActiveAssignmentById) {
    const assignment =
      await this.assignmentRepository.getInstructorActiveAssignmentById(dto);

    if (!assignment) throw new NotFoundException('Assignment not found.');

    if (assignment.assignment.attachments) {
      assignment.assignment.attachments = await Promise.all(
        (
          assignment.assignment.attachments as unknown as AttachmentWithName[]
        ).map(async (a) => ({
          id: a.id,
          name: a.name,
          url: await this.uploadService.createAssignmentReplyAttachmentLink(
            a.id,
          ),
        })),
      );
    }

    return assignment;
  }

  async listAssignmentComments(dto: ListAssignmentCommentsDto) {
    const res = await this.assignmentRepository.listActiveAssignmentComments(
      dto,
    );

    res.messages = await Promise.all(
      res.messages.map(async (m) => {
        if (m.attachments) {
          (m as any).attachments = await Promise.all(
            (m.attachments as unknown as AttachmentWithName[]).map(
              async (ma) => ({
                id: ma.id,
                name: ma.name,
                url: await this.uploadService.createAssignmentReplyAttachmentLink(
                  ma.id,
                ),
              }),
            ),
          );
        }

        m.user.profileImage = this.uploadService.createUserProfileLink(
          m.user.profileImage,
        );

        return m;
      }),
    );

    return res;
  }

  async updateActiveAssignment(dto: UpdateActiveAssignmentDto) {
    const { user, assignmentId, marksObtained } = dto;

    const assignment =
      await this.assignmentRepository.getInstructorActiveAssignmentById({
        id: assignmentId,
        user,
      });

    if (!assignment) throw new NotFoundException('Assignment not found.');

    if (marksObtained > assignment.assignment.maxMarks)
      throw new ConflictException(
        'Obtained marks cannot be greater than max marks.',
      );

    const updated = await this.assignmentRepository.updateActiveAssignment(
      marksObtained,
      { id: assignmentId, ...assignment.assignment },
    );

    return updated;
  }
}
