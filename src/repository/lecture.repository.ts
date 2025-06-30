import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Course, Lecture, LectureGroup, User } from '@prisma/client';

import {
  CreateLectureDto,
  UpdateLectureDto,
  CreateLectureGroupDto,
  ListLecturesPreviewDto,
  ListLecturesEnrolledDto,
  ListLecturesInstructorDto,
  ListLecturesGroupedEnrolledDto,
} from '../lecture/lecture.dto';
import { PrismaService } from './prisma.service';
import { GetCourseProgressDto } from '../course/course.dto';

@Injectable()
export class LectureRepository {
  private exceptionMsg: string;
  private logger = new Logger('LectureRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  /**
   * @description create new lecture
   */
  async createLecture(dto: CreateLectureDto, instructor: User) {
    const {
      quiz,
      title,
      video,
      index,
      preview,
      courseId,
      groupId,
      duration,
      thumbnail,
      assignment,
      description,
      attachments,
    } = dto;
    try {
      const lecture = await this.prisma.lecture.create({
        select: {
          id: true,
          title: true,
          video: true,
          preview: true,
          duration: true,
          thumbnail: true,
          createdAt: true,
          updatedAt: true,
          description: true,
          attachments: true,
          assignments: {
            select: {
              title: true,
              maxMarks: true,
              minMarks: true,
              deadline: true,
              attachments: true,
            },
          },
          quiz: { select: { createdAt: true, questions: true } },
          instructor: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
        data: {
          title,
          index,
          video,
          preview,
          duration,
          courseId,
          thumbnail,
          description,
          lectureGroupId: groupId,
          attachments: attachments.map((a) => ({ id: a.id, name: a.name })),
          instructorId: instructor.id,
          quiz:
            quiz && quiz.length > 0
              ? {
                  create: { questions: quiz as any },
                }
              : undefined,
          assignments: assignment
            ? {
                create: {
                  ...assignment,
                  attachments: assignment.attachments?.map((a) => ({
                    id: a.id,
                    name: a.name,
                  })),
                  deadline: new Date(assignment.deadline * 3600 * 1000),
                },
              }
            : undefined,
        },
      });

      return lecture;
    } catch (err) {
      this.logger.error(`failed to create lecture.`, err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description create lecture group
   */
  async createLectureGroup(dto: CreateLectureGroupDto) {
    const { title, index, courseId } = dto;

    try {
      const lGroup = await this.prisma.lectureGroup.create({
        select: {
          id: true,
          index: true,
          title: true,
          course: { select: { id: true, title: true } },
        },
        data: { courseId, index, title },
      });

      return lGroup;
    } catch (err) {
      this.logger.error('failed to create lecture group', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description get single lecture group by id
   */
  async getLectureGroupById(id: number) {
    try {
      const group = await this.prisma.lectureGroup.findFirst({
        where: { id },
        select: {
          id: true,
          index: true,
          title: true,
          course: {
            select: {
              id: true,
              title: true,
              instructor: { select: { id: true, username: true } },
            },
          },
        },
      });
      return group;
    } catch (err) {
      this.logger.error('failed to get lecture group by id', err);
      this.logger.debug({ id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getLectureGroupsByCourseId(courseId: number) {
    try {
      const groups = await this.prisma.lectureGroup.findMany({
        where: { courseId },
        select: {
          id: true,
          title: true,
          index: true,
        },
      });

      return groups;
    } catch (err) {
      this.logger.error('failed to list lecture groups', err);
      this.logger.debug({ courseId });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description get last lecture group for a course
   */
  async getLastLectureGroup(courseId: number) {
    try {
      const group = await this.prisma.lectureGroup.findFirst({
        where: { courseId },
        orderBy: { index: 'desc' },
      });

      return group;
    } catch (err) {
      this.logger.error('failed to get last lecture group', err);
      this.logger.debug({ courseId });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getLastLectureOfGroup(groupId: number) {
    try {
      const lecture = await this.prisma.lecture.findFirst({
        orderBy: { index: 'desc' },
        where: { lectureGroupId: groupId },
      });

      return lecture;
    } catch (err) {
      this.logger.error('failed to get last lecture of group', err);
      this.logger.debug({ groupId });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description delete lecture group
   */
  async deleteLectureGroup(id: number) {
    try {
      this.prisma.$transaction([
        this.prisma.lecture.updateMany({
          where: { lectureGroupId: id },
          data: { lectureGroupId: null },
        }),
        this.prisma.lectureGroup.delete({
          where: { id },
          select: { id: true },
        }),
      ]);
      return { id, deleted: true };
    } catch (err) {
      this.logger.error('failed to delete lecture group', err);
      this.logger.debug({ lectureGroupId: id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description re-arrange lecture group by index
   */
  async rearrangeLectureInGroup(dto: {
    index: number;
    lecture: Partial<Lecture> & { group: Partial<LectureGroup> };
    group: Partial<LectureGroup> & { course: Partial<Course> };
  }) {
    const { index, group, lecture } = dto;

    /**
     * if direction is < 0 group move down
     * if direction is = 0 group no change
     * if direction is > 0 group move up
     */
    const direction = lecture.index - index;

    if (group.id === lecture.group.id && direction === 0)
      return { id: lecture.id, index, groupId: group.id };

    try {
      await this.prisma.$transaction(async (c) => {
        // group change
        if (group.id !== lecture.group.id) {
          // First decriment the group left
          await c.lecture.updateMany({
            where: {
              index: { gte: lecture.index },
              lectureGroupId: lecture.group.id,
            },
            data: { index: { decrement: 1 } },
          });
          // Second increment the group joined
          await c.lecture.updateMany({
            where: {
              lectureGroupId: group.id,
              index: { gte: index },
            },
            data: { index: { increment: 1 } },
          });
        }

        // move down
        if (group.id === lecture.group.id && direction < 0) {
          await c.lecture.updateMany({
            where: {
              lectureGroupId: group.id,
              AND: [
                { index: { lte: index } },
                { index: { gte: lecture.index } },
              ],
            },
            data: {
              index: { decrement: 1 },
            },
          });
        }

        // move up
        if (group.id === lecture.group.id && direction > 0) {
          await c.lecture.updateMany({
            where: {
              lectureGroupId: group.id,
              AND: [
                { index: { lte: lecture.index } },
                { index: { gte: index } },
              ],
            },
            data: {
              index: { increment: 1 },
            },
          });
        }

        await c.lecture.update({
          where: { id: lecture.id },
          data: { index, lectureGroupId: group.id },
        });
      });
    } catch (err) {
      this.logger.error('failed to re-arrange lectures', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    return { id: lecture.id, index, groupId: group.id };
  }
  /**
   * @description re-arrange lecture group by index
   */
  async rearrangeLectureGroup(dto: {
    index: number;
    group: Partial<LectureGroup> & { course: Partial<Course> };
  }) {
    const { index, group } = dto;

    /**
     * if direction is < 0 group move down
     * if direction is = 0 group no change
     * if direction is > 0 group move up
     */
    const direction = group.index - index;

    if (direction === 0) return { index, groupId: group.id };

    try {
      await this.prisma.$transaction(async (c) => {
        // move down
        if (direction < 0) {
          await c.lectureGroup.updateMany({
            where: {
              courseId: group.course.id,
              AND: [{ index: { lte: index } }, { index: { gte: group.index } }],
            },
            data: {
              index: { decrement: 1 },
            },
          });
        }

        // move up
        if (direction > 0) {
          await c.lectureGroup.updateMany({
            where: {
              courseId: group.course.id,
              AND: [{ index: { lte: group.index } }, { index: { gte: index } }],
            },
            data: {
              index: { increment: 1 },
            },
          });
        }

        await c.lectureGroup.update({
          where: { id: group.id },
          data: { index },
        });
      });
    } catch (err) {
      this.logger.error('failed to re-arrange lecture groups', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    return { index, groupId: group.id };
  }

  /**
   * @description create new lecture
   */
  async updateLecture(dto: UpdateLectureDto) {
    const {
      id,
      quiz,
      title,
      video,
      preview,
      duration,
      thumbnail,
      assignment,
      description,
      attachments,
    } = dto;

    try {
      return await this.prisma.$transaction(async () => {
        let assignmentId = 0;
        if (assignment) {
          const _assignment = await this.prisma.assignment.findFirst({
            select: { id: true },
            where: { lectureId: id },
          });
          assignmentId = _assignment ? _assignment?.id : 0;
        }

        const updated = await this.prisma.lecture.update({
          where: { id },
          select: {
            id: true,
            title: true,
            video: true,
            preview: true,
            duration: true,
            thumbnail: true,
            createdAt: true,
            updatedAt: true,
            description: true,
            attachments: true,
            quiz: {
              select: { questions: true },
            },
            assignments: {
              select: {
                title: true,
                maxMarks: true,
                minMarks: true,
                deadline: true,
                attachments: true,
              },
            },
            instructor: {
              select: {
                id: true,
                lastName: true,
                firstName: true,
                profileImage: true,
              },
            },
          },
          data: {
            title,
            video,
            preview,
            duration,
            thumbnail,
            description,
            attachments: attachments.map((a) => ({ id: a.id, name: a.name })),
            assignments: assignment
              ? {
                  upsert: {
                    where: { id: assignmentId },
                    create: {
                      ...(assignment as any),
                      attachments: assignment.attachments?.map((a) => ({
                        id: a.id,
                        name: a.name,
                      })),
                      deadline: assignment.deadline
                        ? new Date(assignment.deadline * 3600 * 1000)
                        : undefined,
                    },
                    update: {
                      ...(assignment as any),
                      attachments: assignment.attachments?.map((a) => ({
                        id: a.id,
                        name: a.name,
                      })),
                      deadline: assignment.deadline
                        ? new Date(assignment.deadline * 3600 * 1000)
                        : undefined,
                    },
                  },
                }
              : undefined,
            quiz:
              quiz && quiz.length > 0
                ? {
                    upsert: {
                      where: { lectureId: id },
                      create: { questions: quiz as any },
                      update: { questions: quiz as any },
                    },
                  }
                : undefined,
          },
        });

        return updated;
      });
    } catch (err) {
      this.logger.error(`failed to update lecture.`, err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param id lecture id
   * @param instructor lecture instructor
   * @description Soft delete lecture by its instructor
   */
  async deleteLecture(id: number) {
    try {
      const deleted = await this.prisma.lecture.update({
        where: { id },
        data: { deleted: true },
      });
      return deleted;
    } catch (err) {
      this.logger.error('failed to delete lecture', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param id lecture id
   * @description Get lecture by id
   */
  async getLectureByIdInstructor(id: number, instructor: User) {
    try {
      const lecture = await this.prisma.lecture.findFirst({
        select: {
          id: true,
          quiz: {
            select: { questions: true },
          },
          index: true,
          title: true,
          video: true,
          preview: true,
          duration: true,
          thumbnail: true,
          createdAt: true,
          attachments: true,
          description: true,
          assignments: true,
          group: {
            select: { id: true, title: true, index: true },
          },
          instructor: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
        where: {
          deleted: false,
          id,
          OR: [
            {
              instructorId: instructor.id,
            },
            {
              course: {
                associates: {
                  some: { instructorId: instructor.id },
                },
              },
            },
          ],
        },
      });
      return lecture;
    } catch (err) {
      this.logger.error('failed to get lecture by id and instructor', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description List preview lectures for public
   */
  async listLecturesPreview(dto: ListLecturesPreviewDto) {
    const { page, size, search, courseId } = dto;

    try {
      const [total, lectures] = await this.prisma.$transaction([
        this.prisma.lecture.count({
          where: {
            deleted: false,
            course: {
              id: courseId,
            },
            // preview: true,
            title: { mode: 'insensitive', contains: search },
          },
        }),
        this.prisma.lecture.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: [{ group: { index: 'asc' } }, { index: 'asc' }],
          where: {
            course: {
              id: courseId,
              approved: true,
              published: true,
            },
            preview: true,
            title: { mode: 'insensitive', contains: search },
          },
          select: {
            id: true,
            title: true,
            video: true,
            preview: true,
            duration: true,
            thumbnail: true,
            createdAt: true,
            updatedAt: true,
            description: true,
            attachments: true,
            group: {
              select: { id: true, title: true, index: true },
            },
            instructor: {
              select: { id: true, username: true, profileImage: true },
            },
          },
        }),
      ]);

      return { total, lectures };
    } catch (err) {
      this.logger.error('failed to fetch lectures for preview', err);

      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description List lecture for enrolled students
   */
  async listLecturesEnrolled(dto: ListLecturesEnrolledDto) {
    const { page, size, search, courseId, student } = dto;

    try {
      const [total, lectures] = await this.prisma.$transaction([
        this.prisma.lecture.count({
          where: {
            deleted: false,
            course: {
              id: courseId,
              approved: true,
              enrollments: { some: { studentId: student.id } },
            },
            title: { mode: 'insensitive', contains: search },
          },
        }),
        this.prisma.lecture.findMany({
          orderBy: [{ group: { index: 'asc' } }, { index: 'asc' }],
          select: {
            id: true,
            title: true,
            // video: true,
            preview: true,
            duration: true,
            thumbnail: true,
            createdAt: true,
            updatedAt: true,
            description: true,
            attachments: true,
            group: {
              select: { id: true, title: true, index: true },
            },
            lectureProgresses: {
              where: { userId: student.id },
              select: {
                completed: true,
                progress: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            // quiz: { select: { createdAt: true, questions: true } },
            instructor: {
              select: {
                id: true,
                lastName: true,
                firstName: true,
                profileImage: true,
              },
            },
          },
          where: {
            course: {
              id: courseId,
              //TODO: check expiry date for enrollment
              enrollments: { some: { studentId: student.id } },
            },
            title: { mode: 'insensitive', contains: search },
          },

          take: size,
          skip: (page - 1) * size,
        }),
      ]);

      return { total, lectures };
    } catch (err) {
      this.logger.error('failed to fetch lectures for enrolled students', err);

      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listLecturesGroupedEnrolled(dto: ListLecturesGroupedEnrolledDto) {
    const { student, courseId } = dto;
    const g = await this.prisma.lectureGroup.findMany({
      orderBy: [{ index: 'asc' }],
      where: {
        course: {
          id: courseId,
          enrollments: { some: { studentId: student.id } },
        },
      },
      select: {
        title: true,
        index: true,
        lectures: {
          select: {
            id: true,
            index: true,
            video: true,
            title: true,
            preview: true,
            duration: true,
            thumbnail: true,
            instructor: {
              select: {
                id: true,
                lastName: true,
                firstName: true,
                username: true,
                profileImage: true,
              },
            },
          },
          orderBy: [{ index: 'asc' }],
        },
      },
    });

    return g;
  }

  /**
   * @description List lecture for instructor
   */
  async listLecturesInstructor(
    dto: ListLecturesInstructorDto,
    instructor: User,
  ) {
    const { page, size, search, courseId } = dto;

    try {
      const [total, lectures] = await this.prisma.$transaction([
        this.prisma.lecture.count({
          where: {
            deleted: false,
            OR: [
              {
                instructorId: instructor.id,
              },
              {
                course: {
                  associates: {
                    some: { courseId, instructorId: instructor.id },
                  },
                },
              },
            ],
            title: { mode: 'insensitive', contains: search },
          },
        }),
        this.prisma.lecture.findMany({
          orderBy: [{ group: { index: 'asc' } }, { index: 'asc' }],
          select: {
            id: true,
            title: true,
            index: true,
            video: true,
            preview: true,
            duration: true,
            thumbnail: true,
            createdAt: true,
            updatedAt: true,
            description: true,
            attachments: true,
            assignments: {
              select: {
                title: true,
                minMarks: true,
                deadline: true,
                attachments: true,
              },
            },
            quiz: { select: { createdAt: true, questions: true } },
            group: {
              select: { id: true, title: true, index: true },
            },
            instructor: {
              select: {
                id: true,
                lastName: true,
                firstName: true,
                profileImage: true,
              },
            },
          },
          where: {
            courseId,
            OR: [
              {
                instructorId: instructor.id,
              },
              {
                course: {
                  associates: {
                    some: { instructorId: instructor.id },
                  },
                },
              },
            ],
            title: { mode: 'insensitive', contains: search },
          },

          take: size,
          skip: (page - 1) * size,
        }),
      ]);

      return { total, lectures };
    } catch (err) {
      this.logger.error(
        `failed to fetch lectures for instructor: ${instructor.username}`,
        err,
      );

      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Get lecture by id.
   */
  async getLectureByIdEnrolled(id: number, student: User) {
    try {
      const lecture = await this.prisma.lecture.findFirst({
        select: {
          id: true,
          title: true,
          video: true,
          preview: true,
          duration: true,
          thumbnail: true,
          createdAt: true,
          attachments: true,
          description: true,
          courseId: true,
          assignments: {
            select: {
              title: true,
              maxMarks: true,
              minMarks: true,
              deadline: true,
              attachments: true,
            },
          },
          lectureProgresses: {
            where: { userId: student.id },
            select: {
              completed: true,
              progress: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          quiz: { select: { questions: true } },
          instructor: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              username: true,
              profileImage: true,
            },
          },
        },
        where: {
          id,
          AND: [
            {
              course: {
                enrollments: { some: { studentId: student.id } },
              },
            },
          ],
        },
      });

      return lecture;
    } catch (err) {
      this.logger.error('failed to get lecture by id', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Get lecture video only by id.
   */
  async getLectureVideo(id: number, student: User) {
    try {
      const lecture = await this.prisma.lecture.findFirst({
        select: {
          id: true,
          video: true,
          duration: true,
          courseId: true,
          lectureProgresses: {
            where: { userId: student.id },
            select: {
              completed: true,
              progress: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        where: {
          id,
          AND: [
            {
              course: {
                enrollments: { some: { studentId: student.id } },
              },
            },
          ],
        },
      });

      return lecture;
    } catch (err) {
      this.logger.error('failed to get lecture video by id', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getPreviousLectureProgress(lecture: Partial<Lecture>, student: User) {
    try {
      const previousLecture = await this.prisma.lecture.findFirst({
        orderBy: { id: 'desc' },
        where: {
          id: { lt: lecture.id },
          courseId: lecture.courseId,
          course: {
            enrollments: { some: { studentId: student.id } },
          },
        },
        select: {
          id: true,
          courseId: true,
          lectureProgresses: {
            select: { completed: true },
            where: { userId: student.id },
          },
        },
      });

      return previousLecture;
    } catch (err) {
      this.logger.error('failed to get lecture progress', err);
      this.logger.debug({ lectureId: lecture.id, courseId: lecture.courseId });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getNextLecture(lecture: Partial<Lecture>, student: User) {
    try {
      const previousLecture = await this.prisma.lecture.findFirst({
        orderBy: { id: 'desc' },
        where: {
          id: { gt: lecture.id },
          courseId: lecture.courseId,
          course: {
            enrollments: { some: { studentId: student.id } },
          },
        },
        select: {
          id: true,
          quiz: {
            select: { questions: true },
          },
          title: true,
          video: true,
          preview: true,
          duration: true,
          thumbnail: true,
          createdAt: true,
          attachments: true,
          description: true,
          assignments: true,
          instructor: {
            select: {
              id: true,
              profileImage: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return previousLecture;
    } catch (err) {
      this.logger.error('failed to get lecture progress', err);
      this.logger.debug({ lectureId: lecture.id, courseId: lecture.courseId });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getLectureById(id: number) {
    try {
      const lecture = await this.prisma.lecture.findFirst({
        where: { id },
        select: {
          id: true,
          quiz: {
            select: { questions: true },
          },
          title: true,
          video: true,
          preview: true,
          duration: true,
          thumbnail: true,
          createdAt: true,
          attachments: true,
          description: true,
          assignments: true,
          instructor: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
      });
      return lecture;
    } catch (err) {
      this.logger.error('failed to get lecture by id', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getLastLecture(course: Partial<Course>) {
    try {
      const lecture = await this.prisma.lecture.findFirst({
        orderBy: { id: 'desc' },
        where: { courseId: course.id },
      });
      return lecture;
    } catch (err) {
      this.logger.error('failed to get last lecture', err);
      this.logger.debug({ courseId: course.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getLectureProgress(lecture: Partial<Lecture>, user: User) {
    try {
      const progress = await this.prisma.lectureProgress.findFirst({
        where: { lectureId: lecture.id, userId: user.id },
      });

      return progress;
    } catch (err) {
      this.logger.error('failed to get lecture progress', err);
      this.logger.debug({ lectureId: lecture.id, userId: user.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async trackLectureProgress(args: {
    user: User;
    progress: number;
    lectureId: number;
    completed: boolean;
  }) {
    const { lectureId, progress, user, completed } = args;

    const _oldProgress = await this.prisma.lectureProgress.findFirst({
      where: { lectureId, userId: user.id },
    });

    const _completed =
      _oldProgress && _oldProgress.completed ? true : completed;

    const _progress = await this.prisma.lectureProgress.upsert({
      select: {
        progress: true,
        lectureId: true,
        createdAt: true,
        updatedAt: true,
        completed: true,
      },
      update: { progress, completed: _completed },
      where: { userId_lectureId: { userId: user.id, lectureId } },
      create: { userId: user.id, lectureId, progress, completed: _completed },
    });

    return _progress;
  }

  async getLecturesProgress(dto: GetCourseProgressDto) {
    const { user, courseId } = dto;
    const progress = await this.prisma.lecture.findMany({
      where: { courseId },
      orderBy: [{ group: { index: 'asc' } }, { index: 'asc' }],
      select: {
        id: true,
        lectureProgresses: {
          where: { userId: user.id },
          select: {
            progress: true,
            completed: true,
            updatedAt: true,
            lectureId: true,
          },
        },
      },
    });

    return progress;
  }
}
