import {
  Inject,
  Logger,
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { round } from 'lodash';
import * as dayjs from 'dayjs';
import { ConfigService } from '@nestjs/config';
import { NotificationScope, User } from '@prisma/client';

import {
  DeleteLectureDto,
  CreateLectureDto,
  UpdateLectureDto,
  GetLectureByIdDto,
  ReArrangeLectureDto,
  ListLectureGroupsDto,
  CreateLectureGroupDto,
  DeleteLectureGroupDto,
  ListLecturesPreviewDto,
  ListLecturesEnrolledDto,
  TrackLectureProgressDto,
  ReArrangeLectureGroupDto,
  ListLecturesInstructorDto,
  GetLectureByIdInstructorDto,
  ListLecturesGroupedEnrolledDto,
} from './lecture.dto';
import { AttachmentWithName } from '../upload/upload.dto';
import { CourseRepository } from '../repository/course.repository';
import { LectureRepository } from '../repository/lecture.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';
import { EnrolledRepository } from '../repository/enrolled.repository';
import { AssignmentRepository } from '../repository/assignment.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsRepository } from '../repository/notifications.repository';

@Injectable()
export class LectureService {
  private exceptionMsg: string;
  private logger = new Logger('LectureService');
  constructor(
    private configs: ConfigService,
    private courseRepository: CourseRepository,
    private lectureRepository: LectureRepository,
    private enrollmentRepository: EnrolledRepository,
    private notificationService: NotificationsService,
    private assignmentRespository: AssignmentRepository,
    private notificationRepository: NotificationsRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  // create lecture by instructor or associate
  async createLecture(dto: CreateLectureDto, instructor: User, _ip: string) {
    const { courseId, attachments, video, groupId, thumbnail, assignment } =
      dto;

    const course = await this.courseRepository.findCourseByIdAndAssociate(
      courseId,
      instructor,
    );

    if (!course) throw new NotFoundException('Course not found.');

    const groupExist = await this.lectureRepository.getLectureGroupById(
      groupId,
    );

    if (!groupExist || groupExist.course.id !== courseId)
      throw new NotFoundException('Lecture group not found');

    const duration = await this.uploadService.verifyLectureVideoUpload(video);
    dto.duration = round(duration, 2);

    if (!duration) throw new NotFoundException('Video not found.');

    if (attachments) {
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

    if (assignment && assignment.attachments) {
      const atchVerf = await Promise.all(
        attachments.map(async (a) => {
          return {
            name: a.name,
            verified:
              await this.uploadService.verifyLectureAssignmentAttachmentUpload(
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

    const thumbnailExist =
      await this.uploadService.verifyLectureThumbnailUpload(thumbnail);

    if (!thumbnailExist) throw new NotFoundException('Thumbnail not found.');

    const lecture = await this.lectureRepository.createLecture(dto, instructor);

    if (lecture.assignments && lecture.assignments.length > 0) {
      (lecture.assignments[0] as any).deadline =
        lecture.assignments[0].deadline.getTime() / (3600 * 1000);
      (lecture.assignments[0] as any).attachments = await Promise.all(
        (
          lecture.assignments[0].attachments as unknown as AttachmentWithName[]
        ).map(async (a) => ({
          id: a.id,
          name: a.name,
          url: await this.uploadService.createLectureAssignmentAttachmentLink(
            a.id,
          ),
        })),
      );
      (lecture as any).assignment = lecture.assignments[0];
    }

    delete lecture.assignments;

    lecture.instructor.profileImage = this.uploadService.createUserProfileLink(
      lecture.instructor.profileImage,
    );

    lecture.video = await this.uploadService.createLectureVideoLink(
      lecture.video,
    );

    lecture.thumbnail = this.uploadService.createLectureThumbnailLink(
      lecture.thumbnail,
    );

    (lecture as any).attachments = await Promise.all(
      (lecture.attachments as unknown as AttachmentWithName[]).map(
        async (a) => ({
          id: a.id,
          name: a.name,
          url: await this.uploadService.createLectureAttachmentLink(a.id),
        }),
      ),
    );

    return lecture;
  }

  // Update lecture by instructor/associate
  async updateLecture(dto: UpdateLectureDto, instructor: User, _ip: string) {
    const { id, attachments, video, thumbnail } = dto;

    const _lecture = await this.lectureRepository.getLectureByIdInstructor(
      id,
      instructor,
    );

    if (!_lecture) throw new NotFoundException('Lecture not found.');

    if (video) {
      const duration = await this.uploadService.verifyLectureVideoUpload(video);
      dto.duration = round(duration, 2);
      if (!duration) throw new NotFoundException('Video not found.');
    }

    if (attachments) {
      const atchVerf = await Promise.all(
        attachments.map(async (a) => {
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

    if (thumbnail) {
      const thumbnailExist =
        await this.uploadService.verifyLectureThumbnailUpload(thumbnail);

      if (!thumbnailExist) throw new NotFoundException('Thumbnail not found.');
    }

    const lecture = await this.lectureRepository.updateLecture(dto);

    if (lecture.assignments && lecture.assignments.length > 0) {
      (lecture.assignments[0] as any).deadline =
        lecture.assignments[0].deadline.getTime() / (3600 * 1000);
      (lecture.assignments[0] as any).attachments = await Promise.all(
        (
          lecture.assignments[0].attachments as unknown as AttachmentWithName[]
        ).map(async (a) => ({
          id: a.id,
          name: a.name,
          url: await this.uploadService.createLectureAssignmentAttachmentLink(
            a.id,
          ),
        })),
      );
      (lecture as any).assignment = lecture.assignments[0];
    }

    delete lecture.assignments;

    lecture.instructor.profileImage = this.uploadService.createUserProfileLink(
      lecture.instructor.profileImage,
    );

    lecture.video = await this.uploadService.createLectureVideoLink(
      lecture.video,
    );

    lecture.thumbnail = this.uploadService.createLectureThumbnailLink(
      lecture.thumbnail,
    );

    lecture.attachments = await Promise.all(
      (lecture.attachments as unknown as AttachmentWithName[]).map(
        async (a) => ({
          id: a.id,
          name: a.name,
          url: await this.uploadService.createLectureAttachmentLink(a.id),
        }),
      ),
    );

    return lecture;
  }

  async createLectureGroup(dto: CreateLectureGroupDto) {
    const { courseId, instructor } = dto;
    const courseExist = await this.courseRepository.getCourseById(courseId);

    if (!courseExist || courseExist.instructor.id !== instructor.id)
      throw new NotFoundException('Course not found.');

    const lastLectureGroup = await this.lectureRepository.getLastLectureGroup(
      courseId,
    );
    dto.index = lastLectureGroup ? lastLectureGroup.index + 1 : 1;

    const group = await this.lectureRepository.createLectureGroup(dto);

    return group;
  }

  async listLectureGroups(dto: ListLectureGroupsDto) {
    const { courseId, instructor } = dto;
    const courseExist = await this.courseRepository.getCourseById(courseId);
    if (!courseExist || courseExist.instructor.id !== instructor.id)
      throw new NotFoundException('Course not found');

    const groups = await this.lectureRepository.getLectureGroupsByCourseId(
      courseId,
    );

    return groups;
  }

  async deleteLectureGroup(dto: DeleteLectureGroupDto) {
    const { id, instructor } = dto;
    const exist = await this.lectureRepository.getLectureGroupById(id);

    if (!exist || exist.course.instructor.id !== instructor.id)
      throw new NotFoundException('Group not found.');

    const del = await this.lectureRepository.deleteLectureGroup(id);

    return del;
  }

  async reArrangeLectureGroup(dto: ReArrangeLectureGroupDto) {
    const { index, groupId, instructor } = dto;
    const existGroup = await this.lectureRepository.getLectureGroupById(
      groupId,
    );

    if (!existGroup || existGroup.course.instructor.id !== instructor.id)
      throw new NotFoundException('Lecture Group not found.');

    const lastGroup = await this.lectureRepository.getLastLectureGroup(
      existGroup.course.id,
    );

    if (index > lastGroup.index)
      throw new NotFoundException(
        `Index cannot be greater than ${lastGroup.index}.`,
      );

    const r = await this.lectureRepository.rearrangeLectureGroup({
      index,
      group: existGroup,
    });

    return r;
  }

  async reArrangeLecture(dto: ReArrangeLectureDto) {
    const { id, groupId, index, instructor } = dto;

    const lectureExist = await this.lectureRepository.getLectureByIdInstructor(
      id,
      instructor,
    );

    if (!lectureExist) throw new NotFoundException('Lecture not found.');

    const groupExist = await this.lectureRepository.getLectureGroupById(
      groupId,
    );
    if (!groupExist || groupExist.course.instructor.id !== instructor.id)
      throw new NotFoundException('Lecture group not found.');

    const lastLectureOfGroup =
      await this.lectureRepository.getLastLectureOfGroup(groupId);
    if (!lastLectureOfGroup || index > lastLectureOfGroup.index)
      throw new BadRequestException(
        `Index cannot be greater than ${lastLectureOfGroup.index}`,
      );

    const r = await this.lectureRepository.rearrangeLectureInGroup({
      index,
      group: groupExist,
      lecture: lectureExist,
    });

    return r;
  }

  // List instructor/Associates lectures
  async listLecturesInstructor(
    dto: ListLecturesInstructorDto,
    instructor: User,
    _ip: string,
  ) {
    const lectures = await this.lectureRepository.listLecturesInstructor(
      dto,
      instructor,
    );

    lectures.lectures = await Promise.all(
      lectures.lectures.map(async (l) => {
        if (l.assignments && l.assignments.length > 0) {
          (l.assignments[0] as any).attachments = (
            l.assignments[0].attachments as unknown as AttachmentWithName[]
          )?.map(async (a) => ({
            id: a.id,
            name: a.name,
            url: await this.uploadService.createLectureAssignmentAttachmentLink(
              a.id,
            ),
          }));

          (l as any).assignment = l.assignments[0];
        }

        l.instructor.profileImage = this.uploadService.createUserProfileLink(
          l.instructor.profileImage,
        );

        l.video = await this.uploadService.createLectureVideoLink(l.video);

        l.thumbnail = this.uploadService.createLectureThumbnailLink(
          l.thumbnail,
        );

        (l.attachments as any[]) = await Promise.all(
          (l.attachments as unknown as AttachmentWithName[]).map(async (a) => {
            return {
              id: a.id,
              name: a.name,
              url: await this.uploadService.createLectureAttachmentLink(a.id),
            };
          }),
        );

        // delete l.assignments;

        return l;
      }),
    );

    return lectures;
  }

  // List lectures for student enrolled
  async listLecturesEnrolled(dto: ListLecturesEnrolledDto) {
    const lectures = await this.lectureRepository.listLecturesEnrolled(dto);

    lectures.lectures = await Promise.all(
      lectures.lectures.map(async (l, lIdx) => {
        if (l.lectureProgresses.length > 0) {
          (l as any).progress = l.lectureProgresses[0];
        }

        const previousLecture = lectures.lectures[lIdx - 1];

        (l as any).locked = true;
        if (!previousLecture) (l as any).locked = false;
        if (
          previousLecture &&
          (previousLecture as any).progress &&
          (previousLecture as any).progress.completed
        )
          (l as any).locked = false;

        delete l.lectureProgresses;

        // l.video = this.uploadService.createAssetLink({
        //   ip,
        //   publicId: l.video,
        //   duration: l.duration,
        // });
        l.instructor.profileImage = this.uploadService.createUserProfileLink(
          l.instructor.profileImage,
        );

        l.attachments = await Promise.all(
          (l.attachments as unknown as AttachmentWithName[]).map(async (a) => ({
            id: a.id,
            name: a.name,
            url: await this.uploadService.createLectureAttachmentLink(a.id),
          })),
        );
        l.thumbnail = this.uploadService.createLectureThumbnailLink(
          l.thumbnail,
        );

        return l;
      }),
    );

    return lectures;
  }

  async listLecuturesGroupedEnrolled(dto: ListLecturesGroupedEnrolledDto) {
    let groups = await this.lectureRepository.listLecturesGroupedEnrolled(dto);

    groups = await Promise.all(
      groups.map(async (g) => {
        g.lectures = await Promise.all(
          g.lectures.map(async (l) => {
            if (l.instructor.profileImage)
              l.instructor.profileImage =
                this.uploadService.createUserProfileLink(
                  l.instructor.profileImage,
                );

            l.thumbnail = this.uploadService.createLectureThumbnailLink(
              l.thumbnail,
            );

            l.video = await this.uploadService.createLectureVideoLink(l.video);

            return l;
          }),
        );
        return g;
      }),
    );

    return groups;
  }

  // List lectures for student enrolled
  async listLecturesPreview(dto: ListLecturesPreviewDto, _ip: string) {
    const lectures = await this.lectureRepository.listLecturesPreview(dto);

    lectures.lectures = await Promise.all(
      lectures.lectures.map(async (l) => {
        l.video = await this.uploadService.createLectureVideoLink(l.video);

        l.attachments = await Promise.all(
          (l.attachments as unknown as AttachmentWithName[]).map(async (a) => ({
            id: a.id,
            name: a.name,
            url: await this.uploadService.createLectureAttachmentLink(a.id),
          })),
        );

        l.thumbnail = this.uploadService.createLectureThumbnailLink(
          l.thumbnail,
        );

        l.instructor.profileImage = this.uploadService.createUserProfileLink(
          l.instructor.profileImage,
        );

        return l;
      }),
    );

    return lectures;
  }

  async getLectureByIdInstructor(dto: GetLectureByIdInstructorDto) {
    const { id, instructor } = dto;

    const lecture = await this.lectureRepository.getLectureByIdInstructor(
      id,
      instructor,
    );

    if (!lecture) throw new NotFoundException('Lecture not found');

    lecture.video = await this.uploadService.createLectureVideoLink(
      lecture.video,
    );

    lecture.thumbnail = await this.uploadService.createLectureThumbnailLink(
      lecture.thumbnail,
    );

    lecture.instructor.profileImage = this.uploadService.createUserProfileLink(
      lecture.instructor.profileImage,
    );

    (lecture as any).attachments = await Promise.all(
      (lecture.attachments as unknown as AttachmentWithName[]).map(
        async (a) => ({
          id: a.id,
          name: a.name,
          url: await this.uploadService.createLectureAttachmentLink(a.id),
        }),
      ),
    );

    if (lecture.assignments && lecture.assignments.length > 0) {
      (lecture.assignments[0].attachments as any) = await Promise.all(
        (
          lecture.assignments[0].attachments as unknown as AttachmentWithName[]
        )?.map(async (a) => ({
          id: a.id,
          name: a.name,
          url: await this.uploadService.createLectureAssignmentAttachmentLink(
            a.id,
          ),
        })),
      );

      (lecture.assignments[0].deadline as any) =
        lecture.assignments[0].deadline.getTime() / (3600 * 1000);
      (lecture as any).assignment = lecture.assignments[0];
    }

    delete lecture.assignments;

    return lecture;
  }

  // async getLectureById(dto: GetLectureByIdDto) {
  //   const { id, student } = dto;

  //   const lecture = await this.lectureRepository.getLectureByIdEnrolled(
  //     id,
  //     student,
  //   );

  //   if (!lecture) throw new NotFoundException('Lecture not found.');

  //   if (lecture.lectureProgresses && lecture.lectureProgresses.length > 0) {
  //     (lecture as any).progress = lecture.lectureProgresses[0];
  //   }

  //   delete lecture.lectureProgresses;

  //   const previousLecture =
  //     await this.lectureRepository.getPreviousLectureProgress(lecture, student);

  //   if (previousLecture) {
  //     if (previousLecture.lectureProgresses.length <= 0)
  //       throw new ForbiddenException('Lecture is locked');
  //     if (!previousLecture.lectureProgresses[0].completed)
  //       throw new ForbiddenException('Lecture is locked');
  //   }

  //   if (lecture.assignments && lecture.assignments.length > 0) {
  //     (lecture.assignments[0] as any).attachments = await Promise.all(
  //       (
  //         lecture.assignments[0].attachments as unknown as AttachmentWithName[]
  //       )?.map(async (a) => ({
  //         id: a.id,
  //         name: a.name,
  //         url: await this.uploadService.createLectureAssignmentAttachmentLink(
  //           a.id,
  //         ),
  //       })),
  //     );
  //     // lecture.assignments[0].attachments.map((a) => ({
  //     //   id: a,
  //     //   url: this.uploadService.createAssetLink({
  //     //     publicId: a,
  //     //   }),
  //     // }));
  //     (lecture.assignments[0].deadline as any) =
  //       lecture.assignments[0].deadline.getTime() / (3600 * 1000);
  //     (lecture as any).assignment = lecture.assignments[0];
  //   }

  //   delete lecture.courseId;
  //   delete lecture.assignments;

  //   lecture.video = await this.uploadService.createLectureVideoLink(
  //     lecture.video,
  //   );

  //   lecture.instructor.profileImage = this.uploadService.createUserProfileLink(
  //     lecture.instructor.profileImage,
  //   );

  //   lecture.attachments = await Promise.all(
  //     (lecture.attachments as unknown as AttachmentWithName[])?.map(
  //       async (a) => ({
  //         id: a.id,
  //         name: a.name,
  //         url: await this.uploadService.createLectureAttachmentLink(a.id),
  //       }),
  //     ),
  //   );

  //   lecture.thumbnail = this.uploadService.createLectureThumbnailLink(
  //     lecture.thumbnail,
  //   );

  //   return lecture;
  // }

  async getLectureVideo(dto: GetLectureByIdDto) {
    const { id, student } = dto;

    const lecture = await this.lectureRepository.getLectureVideo(id, student);

    if (!lecture) throw new NotFoundException('Lecture not found.');

    if (lecture.lectureProgresses && lecture.lectureProgresses.length > 0) {
      (lecture as any).progress = lecture.lectureProgresses[0];
    }

    delete lecture.lectureProgresses;

    const previousLecture =
      await this.lectureRepository.getPreviousLectureProgress(lecture, student);

    if (previousLecture) {
      if (previousLecture.lectureProgresses.length <= 0)
        throw new ForbiddenException('Lecture is locked');
      if (!previousLecture.lectureProgresses[0].completed)
        throw new ForbiddenException('Lecture is locked');
    }

    lecture.video = await this.uploadService.createLectureVideoLink(
      lecture.video,
    );

    return { video: lecture.video };
  }

  // async getLectureVideo(dto: GetLectureByIdDto) {
  //   const { id, student } = dto;

  //   const lecture = await this.lectureRepository.getLectureVideo(id, student);

  //   if (!lecture) throw new NotFoundException('Lecture not found.');

  //   lecture.video = await this.uploadService.createLectureVideoLink(
  //     lecture.video,
  //   );

  //   return { video: lecture.video };
  // }

  async deleteLecture(dto: DeleteLectureDto, instructor: User) {
    const lecture = await this.lectureRepository.getLectureById(dto.id);
    if (lecture.instructor.id !== instructor.id)
      throw new NotFoundException('Lecture not found.');

    const deleted = await this.lectureRepository.deleteLecture(dto.id);

    return { id: deleted.id };
  }

  async trackLectureProgress(dto: TrackLectureProgressDto) {
    const { lectureId, duration, user } = dto;
    const enrollment =
      await this.enrollmentRepository.getEnrollmentByLectureAndUser(
        lectureId,
        user,
      );

    if (enrollment && enrollment.expiry) {
      const exp = dayjs(enrollment.expiry);
      if (exp.diff() > 0)
        throw new ForbiddenException('You are not enrolled in this course.');
    }

    let completed = false;
    const lecture = await this.lectureRepository.getLectureById(lectureId);

    if (!lecture) throw new NotFoundException('Lecture not found .');

    if (duration > lecture.duration)
      throw new ConflictException(
        'Progress cannot be more than lecture duration',
      );

    if (duration >= lecture.duration - 10) completed = true;
    const progress = await this.lectureRepository.trackLectureProgress({
      user,
      completed,
      progress: duration,
      lectureId: lectureId,
    });

    if (completed && lecture.assignments && lecture.assignments.length > 0) {
      // Dont know why the f*ck on first place i make it to unlock next lecture
      // assignment instead of unlocking same lecture assignment which make more scense

      // const nextLecture = await this.lectureRepository.getNextLecture(
      //   lecture,
      //   user,
      // );

      // if (nextLecture && nextLecture.assignments.length > 0) {
      const created = await this.assignmentRespository.createActiveAssignment(
        lecture.assignments[0],
        user,
      );
      if (created) {
        const noti = await this.notificationRepository.createNotification({
          notification: {
            // userId: user.id,
            user,
            title: 'New assignment added',
            scope: NotificationScope.Individual,
            message: 'New assignment has been added',
          },
        });
        (noti as any).user = user;
        this.notificationService.sendUserNotification(noti as any);
        // }
      }
    }

    return progress;
  }
}
