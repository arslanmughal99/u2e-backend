import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  AdminListCoursesDto,
  AdminUpdateCourseDto,
  AdminGetCourseByIdDto,
} from './dto/course.dto';
import { CourseRepository } from '../repository/course.repository';
import { UPLOAD_SERVICE, UploadService } from '../upload/upload.port';

@Injectable()
export class AdminCourseService {
  constructor(
    private courseRepository: CourseRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async listCourses(dto: AdminListCoursesDto) {
    const courses = await this.courseRepository.adminListCourses(dto);

    courses.courses = courses.courses.map((c) => {
      (c.associates as any) = c.associates.map((a) => {
        if (a.instructor.profileImage)
          a.instructor.profileImage = this.uploadService.createUserProfileLink(
            a.instructor.profileImage,
          );
        return a.instructor;
      });

      c.category.icon = this.uploadService.createCategoryIconLink(
        c.category.icon,
      );

      if (!c.organization) delete c.organization;
      if (c.thumbnail) {
        c.thumbnail = this.uploadService.createCourseThumbnailLink(c.thumbnail);
      }
      return c;
    });

    return courses;
  }

  async getCourseById(dto: AdminGetCourseByIdDto) {
    const { id } = dto;
    const course = await this.courseRepository.getCourseById(id);

    course.instructor.profileImage = this.uploadService.createUserProfileLink(
      course.instructor.profileImage,
    );

    (course.associates as any) = course.associates.map((a) => {
      if (a.instructor.profileImage)
        a.instructor.profileImage = this.uploadService.createUserProfileLink(
          a.instructor.profileImage,
        );
      return a.instructor;
    });

    course.category.icon = this.uploadService.createCategoryIconLink(
      course.category.icon,
    );

    if (!course.organization) delete course.organization;
    if (course.thumbnail) {
      course.thumbnail = this.uploadService.createCourseThumbnailLink(
        course.thumbnail,
      );
    }

    return course;
  }

  async updateCourse(dto: AdminUpdateCourseDto) {
    const { id } = dto;

    const exist = await this.courseRepository.getCourseById(id);
    if (!exist) throw new NotFoundException('Course not found.');

    const course = await this.courseRepository.adminUpdateCourse(dto);
    course.thumbnail = this.uploadService.createCourseThumbnailLink(
      course.thumbnail,
    );
    course.category.icon = this.uploadService.createCategoryIconLink(
      course.category.icon,
    );

    if (course.organization) {
      course.organization.coverImage = this.uploadService.createUserCoverLink(
        course.organization.coverImage,
      );
    }

    return course;
  }
}
