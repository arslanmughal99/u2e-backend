import {
  User,
  Assignment,
  ActiveAssignment,
  AssignmentStatus,
} from '@prisma/client';
import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ListUserAssignmentDto,
  ListAssignmentCommentsDto,
  ListInstructorActiveAssignmentDto,
} from '../assignment/assignment.dto';
import { PrismaService } from './prisma.service';
import { AttachmentsDto } from '../upload/upload.dto';

@Injectable()
export class AssignmentRepository {
  private exceptionMsg: string;
  private logger = new Logger('AssignmentRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  async createActiveAssignment(assignment: Assignment, student: User) {
    const deadline = new Date(Date.now() + assignment.deadline.getTime());

    try {
      const exist = await this.prisma.activeAssignment.findFirst({
        where: { userId: student.id, assignmentId: assignment.id },
      });

      if (exist) return;

      const activeAssignment = await this.prisma.activeAssignment.create({
        data: { assignmentId: assignment.id, userId: student.id, deadline },
      });
      return activeAssignment;
    } catch (err) {
      this.logger.error('failed to create active assginment', err);
      this.logger.debug({ assignmentId: assignment.id, studentId: student.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getActiveAsssignmentByOwners(args: { id: number; user: User }) {
    const { id, user } = args;

    try {
      const activeAssignment = await this.prisma.activeAssignment.findFirst({
        where: {
          id,
          OR: [
            { userId: user.id },
            {
              assignment: {
                lecture: {
                  course: {
                    OR: [
                      { instructorId: user.id },
                      { associates: { some: { instructorId: user.id } } },
                    ],
                  },
                },
              },
            },
          ],
        },
      });

      return activeAssignment;
    } catch (err) {
      this.logger.error('failed to get active assignment for owner', err);
      this.logger.debug({ id, userId: user.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async createActiveAssignmentReply(args: {
    user: User;
    message: string;
    attachments?: AttachmentsDto[];
    activeAssignment: ActiveAssignment;
  }) {
    const { user, message, attachments, activeAssignment } = args;

    try {
      const reply = await this.prisma.assignmentMessage.create({
        data: {
          message,
          userId: user.id,
          activeAssignmentId: activeAssignment.id,
          attachments: attachments.map((a) => ({ id: a.id, name: a.name })),
        },
        select: {
          id: true,
          message: true,
          createdAt: true,
          attachments: true,
          user: { select: { id: true, username: true, profileImage: true } },
        },
      });
      return reply;
    } catch (err) {
      this.logger.error('failed to reply on assignment', err);
      this.logger.debug({
        message,
        attachments,
        userId: user.id,
        activeAssignemntId: activeAssignment.id,
      });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getUserActiveAssignmentById(args: { id: number; user: User }) {
    const { id, user } = args;
    try {
      const activeAssignment = await this.prisma.activeAssignment.findFirst({
        where: { id, userId: user.id },
        // select: {
        select: {
          id: true,
          status: true,
          deadline: true,
          createdAt: true,
          updatedAt: true,
          marksObtained: true,
          assignment: {
            select: {
              lecture: {
                select: {
                  id: true,
                  title: true,
                  thumbnail: true,
                  course: { select: { title: true, id: true } },
                },
              },
              title: true,
              minMarks: true,
              maxMarks: true,
              attachments: true,
            },
          },
        },
      });

      return activeAssignment;
    } catch (err) {
      this.logger.error('failed to get active user assignment by id', err);
      this.logger.debug({ id, userId: user.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getActiveAssignmentByUserAndLecture(lectureId: number, user: User) {
    try {
      const assignment = await this.prisma.activeAssignment.findFirst({
        where: { userId: user.id, assignment: { lectureId } },
        select: {
          id: true,
          status: true,
          deadline: true,
          marksObtained: true,
          assignment: {
            select: {
              title: true,
              maxMarks: true,
              minMarks: true,
              deadline: true,
              attachments: true,
            },
          },
        },
      });

      return assignment;
    } catch (err) {
      this.logger.error(
        'failed to get active assignment by user and lecture',
        err,
      );
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listUserActiveAssignments(dto: ListUserAssignmentDto) {
    const { courseId, search, user, page, size, status } = dto;

    try {
      const [total, assignments] = await this.prisma.$transaction([
        this.prisma.activeAssignment.count({
          where: {
            status,
            userId: user.id,
            assignment: { lecture: { courseId }, title: { contains: search } },
          },
        }),
        this.prisma.activeAssignment.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            status,
            userId: user.id,
            assignment: { lecture: { courseId }, title: { contains: search } },
          },
          select: {
            id: true,
            status: true,
            deadline: true,
            createdAt: true,
            updatedAt: true,
            marksObtained: true,
            assignment: {
              select: {
                lecture: {
                  select: {
                    id: true,
                    title: true,
                    thumbnail: true,
                    course: { select: { title: true, id: true } },
                  },
                },
                title: true,
                minMarks: true,
                maxMarks: true,
                attachments: true,
              },
            },
          },
        }),
      ]);

      return { total, assignments };
    } catch (err) {
      this.logger.error('failed to list user assignements', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listInstructorActiveAssignments(
    dto: ListInstructorActiveAssignmentDto,
  ) {
    const { page, size, user, status, search, username, courseId } = dto;

    try {
      const [total, assignments] = await this.prisma.$transaction([
        this.prisma.activeAssignment.count({
          where: {
            status,
            user: { username },
            assignment: {
              title: { contains: search },
              lecture: {
                courseId,
                course: {
                  OR: [
                    { instructorId: user.id },
                    { associates: { some: { instructorId: user.id } } },
                  ],
                },
              },
            },
          },
        }),
        this.prisma.activeAssignment.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            status,
            user: { username },
            assignment: {
              title: { contains: search },
              lecture: {
                courseId,
                course: {
                  OR: [
                    { instructorId: user.id },
                    { associates: { some: { instructorId: user.id } } },
                  ],
                },
              },
            },
          },
          select: {
            id: true,
            status: true,
            deadline: true,
            marksObtained: true,
            assignment: {
              select: { title: true, minMarks: true, maxMarks: true },
            },
          },
        }),
      ]);

      return { total, assignments };
    } catch (err) {
      this.logger.error('failed to list instructor assignements', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getInstructorActiveAssignmentById(args: { id: number; user: User }) {
    const { id, user } = args;
    try {
      const activeAssignment = await this.prisma.activeAssignment.findFirst({
        where: {
          id,
          assignment: {
            lecture: {
              course: {
                OR: [
                  { instructorId: user.id },
                  { associates: { some: { instructorId: user.id } } },
                ],
              },
            },
          },
        },
        select: {
          id: true,
          status: true,
          deadline: true,
          marksObtained: true,
          assignment: {
            select: {
              title: true,
              attachments: true,
              minMarks: true,
              maxMarks: true,
            },
          },
        },
      });

      return activeAssignment;
    } catch (err) {
      this.logger.error('failed to get active user assignment by id', err);
      this.logger.debug({ id, userId: user.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listActiveAssignmentComments(dto: ListAssignmentCommentsDto) {
    const { page, size, user, assignmentId } = dto;

    try {
      const [total, messages] = await this.prisma.$transaction([
        this.prisma.assignmentMessage.count({
          where: {
            activeAssignmentId: assignmentId,
            OR: [
              { userId: user.id },
              {
                activeAssignment: {
                  assignment: {
                    lecture: {
                      course: {
                        OR: [
                          { instructorId: user.id },
                          { associates: { some: { instructorId: user.id } } },
                        ],
                      },
                    },
                  },
                },
              },
            ],
          },
        }),
        this.prisma.assignmentMessage.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            activeAssignmentId: assignmentId,
            OR: [
              { userId: user.id },
              {
                activeAssignment: {
                  assignment: {
                    lecture: {
                      course: {
                        OR: [
                          { instructorId: user.id },
                          { associates: { some: { instructorId: user.id } } },
                        ],
                      },
                    },
                  },
                },
              },
            ],
          },
          select: {
            id: true,
            message: true,
            createdAt: true,
            attachments: true,
            user: { select: { id: true, username: true, profileImage: true } },
          },
        }),
      ]);

      return { total, messages };
    } catch (err) {
      this.logger.error('failed to get assignment messages', err);
      this.logger.debug({ assignmentId, userId: user.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateActiveAssignment(
    marksObtained: number,
    assignment: Partial<Assignment>,
  ) {
    const status =
      marksObtained >= assignment.minMarks
        ? AssignmentStatus.Passed
        : AssignmentStatus.Failed;

    try {
      const updated = await this.prisma.activeAssignment.update({
        where: { id: assignment.id },
        data: {
          status,
          marksObtained,
        },
        select: {
          id: true,
          status: true,
          deadline: true,
          marksObtained: true,
          assignment: {
            select: { title: true, minMarks: true, maxMarks: true },
          },
        },
      });
      return updated;
    } catch (err) {
      this.logger.error('failed to update active assignment', err);
      this.logger.debug({ activeAssignmentId: assignment.id, marksObtained });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateActiveAssignmentStatus(id: number, status: AssignmentStatus) {
    try {
      const updated = await this.prisma.activeAssignment.update({
        where: { id },
        data: { status },
      });
      return updated;
    } catch (err) {
      this.logger.error('failed to update assignment status', err);
      this.logger.debug({ id, status });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
