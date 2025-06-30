import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Course, User } from '@prisma/client';

import {
  ListBundlesDto,
  CreateBundleDto,
  DeleteBundleDto,
  UpdateBundleDto,
  GetBundleByIdDto,
  ListInstructorBundlesDto,
} from './bundle.dto';
import { CourseRepository } from '../repository/course.repository';
import { BundleRepository } from '../repository/bundle.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

@Injectable()
export class BundleService {
  constructor(
    private courseRepository: CourseRepository,
    private bundleRepository: BundleRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async createBundle(dto: CreateBundleDto, instructor: User, _ip: string) {
    const { courseIds } = dto;
    const courses = await this.courseRepository.getCoursesByIdsAndInstructor(
      courseIds,
      instructor,
    );

    if (courses.length < 2)
      throw new BadRequestException('Please select more than 2 courses.');

    const bundle = await this.bundleRepository.createBundle({
      ...dto,
      courses,
      instructor,
    });

    bundle.courses = bundle.courses.map((c) => {
      c.thumbnail = this.uploadService.createCourseThumbnailLink(c.thumbnail);
      return c;
    });

    delete bundle.deleted;
    delete bundle.instructorId;

    return bundle;
  }

  async updateBundle(dto: UpdateBundleDto, instructor: User) {
    let courses: Course[];

    const { courseIds } = dto;
    if (courseIds) {
      courses = await this.courseRepository.getCoursesByIdsAndInstructor(
        courseIds,
        instructor,
      );

      if (courses.length > 2)
        throw new BadRequestException('Please select more than 2 courses.');
    }

    const bundle = await this.bundleRepository.updateBundle({
      ...dto,
      courses,
      instructor,
    });

    bundle.courses = bundle.courses.map((c) => {
      c.thumbnail = this.uploadService.createCourseThumbnailLink(c.thumbnail);
      return c;
    });

    delete bundle.deleted;
    delete bundle.instructorId;

    return bundle;
  }

  async deleteBundle(dto: DeleteBundleDto, instructor: User) {
    const { id } = dto;

    const bundle = await this.bundleRepository.getBundleById(id);

    if (bundle.instructorId !== instructor.id || bundle.deleted)
      throw new NotFoundException('Bundle not found.');

    const deleted = await this.bundleRepository.deleteBundle(id);

    return { id: deleted };
  }

  async listInstructorBundles(
    dto: ListInstructorBundlesDto,
    ip: string,
    instructor: User,
  ) {
    const bundles = await this.bundleRepository.listBundles(dto, instructor);

    bundles.bundles = bundles.bundles.map((b) => {
      b.courses = b.courses.map((c) => {
        c.thumbnail = this.uploadService.createCourseThumbnailLink(c.thumbnail);
        return c;
      });

      // b.instructor.profileImage = this.uploadService.createAssetLink(
      //   b.instructor.profileImage,
      //   ip,
      // );

      return b;
    });

    return bundles;
  }

  async listBundles(dto: ListBundlesDto) {
    const bundles = await this.bundleRepository.listBundles(dto);

    bundles.bundles = bundles.bundles.map((b) => {
      b.courses = b.courses.map((c) => {
        c.thumbnail = this.uploadService.createCourseThumbnailLink(c.thumbnail);
        return c;
      });

      // b.instructor.profileImage = this.uploadService.createAssetLink(
      //   b.instructor.profileImage,
      //   ip,
      // );

      return b;
    });

    return bundles;
  }

  async getBundleById(dto: GetBundleByIdDto) {
    const bundle = await this.bundleRepository.getBundleById(dto.id);
    bundle.courses = bundle.courses.map((c) => {
      c.thumbnail = this.uploadService.createCourseThumbnailLink(c.thumbnail);
      return c;
    });

    delete bundle.deleted;
    delete bundle.instructorId;

    return bundle;
  }
}
