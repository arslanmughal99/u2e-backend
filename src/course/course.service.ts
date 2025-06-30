import {
  Inject,
  Logger,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { round } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { BillingType, User } from '@prisma/client';

import {
  CreateCourseDto,
  UpdateCourseDto,
  GetCourseByIdDto,
  PublishCourseDto,
  ListPublicCoursesDto,
  ListCourseReviewsDto,
  GetCourseProgressDto,
  CreateCourseReviewDto,
  ListEnrolledCoursesDto,
  GetEnrolledCourseByIdDto,
  ListInstructorCoursesDto,
} from './course.dto';
import { AuthUtils } from '../auth/auth.utils';
import { CourseRepository } from '../repository/course.repository';
import { LectureRepository } from '../repository/lecture.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';
import { CategoryRepository } from '../repository/category.repository';
import { EnrolledRepository } from '../repository/enrolled.repository';
import { RewardPointsService } from '../reward-points/reward-points.service';
import { RewardPointsConditionKey } from '../repository/reward-points.repository';

@Injectable()
export class CourseService {
  private logger = new Logger('CourseService');
  constructor(
    private authUtils: AuthUtils,
    private configs: ConfigService,
    private courseRepository: CourseRepository,
    private lectureRepository: LectureRepository,
    private categoryRepository: CategoryRepository,
    private enrollmentRepository: EnrolledRepository,
    private rewardPointsService: RewardPointsService,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async createCourse(dto: CreateCourseDto) {
    const { thumbnail } = dto;
    if (dto.billingType === BillingType.Free) {
      dto.price = 0;
    }

    const thumbnailExist = await this.uploadService.verifyCourseThumbnailUpload(
      thumbnail,
    );

    if (!thumbnailExist) throw new NotFoundException('Thumbnail not found.');

    const category = await this.categoryRepository.getCategoryById(
      dto.categoryId,
    );

    if (!category) throw new NotFoundException('Category not found.');

    dto._category = category;

    const course = await this.courseRepository.createCourse(dto);
    course.thumbnail = this.uploadService.createCourseThumbnailLink(
      course.thumbnail,
    );

    course.category.icon = this.uploadService.createCategoryIconLink(
      course.category.icon,
    );

    return course;
  }

  async updateCourse(dto: UpdateCourseDto) {
    const { thumbnail } = dto;
    if (dto.billingType && dto.billingType === BillingType.Free) {
      dto.price = 0;
    }

    if (thumbnail) {
      const thumbnailExist =
        await this.uploadService.verifyCourseThumbnailUpload(thumbnail);

      if (!thumbnailExist) throw new NotFoundException('Thumbnail not found.');
    }

    const category = await this.categoryRepository.getCategoryById(
      dto.categoryId,
    );

    if (!category) throw new NotFoundException('Category not found.');

    dto._category = category;

    const course = await this.courseRepository.updateCourse(dto);
    course.thumbnail = this.uploadService.createCourseThumbnailLink(
      course.thumbnail,
    );

    course.category.icon = await this.uploadService.createCategoryIconLink(
      course.category.icon,
    );

    if (course.organization) {
      course.organization.coverImage =
        await this.uploadService.createUserCoverLink(
          course.organization.coverImage,
        );
    }

    return course;
  }

  async publishCourse(dto: PublishCourseDto) {
    const { id, instructor } = dto;

    const exist = await this.courseRepository.getCourseById(id);
    if (!exist || exist.instructor.id !== instructor.id)
      throw new NotFoundException('Course not found.');

    if (exist.published)
      throw new ConflictException('Course already published');

    const c = await this.courseRepository.publishCourse(dto);

    if (c.published)
      await this.rewardPointsService.giveRewardPoints(
        instructor,
        RewardPointsConditionKey.PublishingCourse,
      );

    return { published: true };
  }

  async listInstructorCourse(dto: ListInstructorCoursesDto, instructor: User) {
    const courses = await this.courseRepository.listInstrucorCourses(
      dto,
      instructor,
    );

    courses.courses = courses.courses.map((c) => {
      c.thumbnail = this.uploadService.createCourseThumbnailLink(c.thumbnail);

      c.category.icon = this.uploadService.createCategoryIconLink(
        c.category.icon,
      );

      (c.associates as any) = c.associates.map((a) => {
        if (a.instructor.profileImage)
          a.instructor.profileImage = this.uploadService.createUserProfileLink(
            a.instructor.profileImage,
          );

        return a.instructor;
      });
      return c;
    });

    return courses;
  }

  async listCourse(dto: ListPublicCoursesDto, _token?: string) {
    let user: User;
    if (_token) user = await this.authUtils.validateUser(_token);

    const courses = await this.courseRepository.listCourses(dto, user);
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

  async listPopularCourses(_token?: string) {
    let user: User;
    if (_token) user = await this.authUtils.validateUser(_token);

    const courses = await this.courseRepository.getPopularCourses(user);
    courses.courses = courses.courses.map((c) => {
      (c.associates as any) = c.associates.map((a) => {
        if (a.instructor.profileImage) {
          a.instructor.profileImage = this.uploadService.createUserProfileLink(
            a.instructor.profileImage,
          );
        }
        return a.instructor;
      });

      c.instructor.profileImage = this.uploadService.createUserProfileLink(
        c.instructor.profileImage,
      );

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

  async listBestSellerCourses(_token?: string) {
    let user: User;
    if (_token) user = await this.authUtils.validateUser(_token);
    const courses = await this.courseRepository.getBestSellingCourses(user);
    courses.courses = courses.courses.map((c) => {
      (c.associates as any) = c.associates.map((a) => {
        if (a.instructor.profileImage)
          a.instructor.profileImage = this.uploadService.createUserProfileLink(
            a.instructor.profileImage,
          );
        return a.instructor;
      });

      if (c.instructor.profileImage)
        c.instructor.profileImage = this.uploadService.createUserProfileLink(
          c.instructor.profileImage,
        );

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

  async listEnrolledCourse(dto: ListEnrolledCoursesDto, student: User) {
    const courses = await this.courseRepository.listEnrolledCourses(
      dto,
      student,
    );

    courses.courses = courses.courses.map((c) => {
      c.instructor.profileImage = this.uploadService.createUserProfileLink(
        c.instructor.profileImage,
      );

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

  async getCourseById(dto: GetCourseByIdDto, _token: string) {
    let user: User;
    if (_token) user = await this.authUtils.validateUser(_token);

    const { id } = dto;
    const course = await this.courseRepository.getCourseById(id, user);

    if (!course) throw new NotFoundException('Course not found.');
    if (!course.approved) throw new NotFoundException('Course not found.');
    if (!course.published) throw new NotFoundException('Course not found.');

    delete course.approved;
    delete course.published;

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

  async getCourseDetailsById(dto: GetCourseByIdDto) {
    const { id } = dto;
    const course = await this.courseRepository.getCourseDetailsById(id);

    if (!course) throw new NotFoundException('Course not found.');

    if (course.instructor.profileImage)
      course.instructor.profileImage = this.uploadService.createUserProfileLink(
        course.instructor.profileImage,
      );

    // (course.instructor as any).courses = course.instructor._count.courses;
    // (course.instructor as any).reviews = course.instructor._count.reviews;
    // (course.instructor as any).enrollments =
    //   course.instructor._count.enrollments;

    // delete course.instructor._count;

    (course as any).rating = {
      total: course.reviews.length,
      onestar: this.calcRatingCount(course.reviews, 1),
      twostar: this.calcRatingCount(course.reviews, 2),
      threestar: this.calcRatingCount(course.reviews, 3),
      fourstar: this.calcRatingCount(course.reviews, 4),
      fivestar: this.calcRatingCount(course.reviews, 5),
      average:
        course.reviews.length > 0
          ? round(
              course.reviews.reduce((sum, rating) => {
                sum.rating = sum.rating + rating.rating;
                return sum;
              }).rating / course.reviews.length,
              1,
            )
          : 0,
    };

    delete course.reviews;

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

    (course as any).groups = await Promise.all(
      course.lectureGroups.map(async (g) => {
        g.lectures = await Promise.all(
          g.lectures.map(async (l) => {
            l.thumbnail = this.uploadService.createLectureThumbnailLink(
              l.thumbnail,
            );

            if (l.preview) {
              l.video = await this.uploadService.createLectureVideoLink(
                l.video,
              );
            } else {
              delete l.video;
            }

            l.instructor.profileImage =
              this.uploadService.createUserProfileLink(
                l.instructor.profileImage,
              );
            return l;
          }),
        );

        return g;
      }),
    );

    delete course.lectureGroups;

    // course.lectures = await Promise.all(
    //   course.lectures.map(async (l) => {
    //     if (l.preview) {
    //       l.video = await this.uploadService.createLectureVideoLink(l.video);
    //     } else {
    //       delete l.video;
    //     }

    //     l.thumbnail = this.uploadService.createLectureThumbnailLink(
    //       l.thumbnail,
    //     );

    //     l.instructor.profileImage = this.uploadService.createUserProfileLink(
    //       l.instructor.profileImage,
    //     );

    //     return l;
    //   }),
    // );

    return course;
  }

  async getEnrolledCourseDetailsById(dto: GetEnrolledCourseByIdDto) {
    // const { id } = dto;
    const course = await this.courseRepository.getEnrolledCourseDetailsById(
      dto,
    );

    if (!course) throw new NotFoundException('Course not found.');

    if (course.instructor.profileImage)
      course.instructor.profileImage = this.uploadService.createUserProfileLink(
        course.instructor.profileImage,
      );

    // (course.instructor as any).courses = course.instructor._count.courses;
    // (course.instructor as any).reviews = course.instructor._count.reviews;
    // (course.instructor as any).enrollments =
    //   course.instructor._count.enrollments;

    // delete course.instructor._count;

    (course as any).rating = {
      total: course.reviews.length,
      onestar: this.calcRatingCount(course.reviews, 1),
      twostar: this.calcRatingCount(course.reviews, 2),
      threestar: this.calcRatingCount(course.reviews, 3),
      fourstar: this.calcRatingCount(course.reviews, 4),
      fivestar: this.calcRatingCount(course.reviews, 5),
      average:
        course.reviews.length > 0
          ? round(
              course.reviews.reduce((sum, rating) => {
                sum.rating = sum.rating + rating.rating;
                return sum;
              }).rating / course.reviews.length,
              1,
            )
          : 0,
    };

    delete course.reviews;

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

    (course as any).groups = await Promise.all(
      course.lectureGroups.map(async (g) => {
        g.lectures = await Promise.all(
          g.lectures.map(async (l) => {
            l.thumbnail = this.uploadService.createLectureThumbnailLink(
              l.thumbnail,
            );

            // l.video = await this.uploadService.createLectureVideoLink(l.video);

            l.instructor.profileImage =
              this.uploadService.createUserProfileLink(
                l.instructor.profileImage,
              );
            return l;
          }),
        );

        return g;
      }),
    );

    delete course.lectureGroups;

    // course.lectures = await Promise.all(
    //   course.lectures.map(async (l) => {
    //     if (l.preview) {
    //       l.video = await this.uploadService.createLectureVideoLink(l.video);
    //     } else {
    //       delete l.video;
    //     }

    //     l.thumbnail = this.uploadService.createLectureThumbnailLink(
    //       l.thumbnail,
    //     );

    //     l.instructor.profileImage = this.uploadService.createUserProfileLink(
    //       l.instructor.profileImage,
    //     );

    //     return l;
    //   }),
    // );

    return course;
  }

  async getCourseProgress(dto: GetCourseProgressDto) {
    let progress = await this.lectureRepository.getLecturesProgress(dto);

    progress = progress.map((p, idx) => {
      if (p.lectureProgresses.length > 0) {
        (p as any).progress = p.lectureProgresses[0].progress;
        (p as any).updatedAt = p.lectureProgresses[0].updatedAt;
        (p as any).completed = p.lectureProgresses[0].completed;
      }
      delete p.lectureProgresses;

      if (idx === 0) {
        (p as any).locked = false;
        return p;
      }

      const previousProgress = progress[idx - 1];
      if ((previousProgress as any).completed) {
        (p as any).locked = false;
      } else {
        (p as any).locked = true;
      }

      return p;
    });
    return { progress };
  }

  async listCategories() {
    const res = await this.categoryRepository.listCategories();
    res.categories = res.categories.map((c) => {
      c.icon = this.uploadService.createCategoryIconLink(c.icon);
      return c;
    });

    return res;
  }

  async createReview(dto: CreateCourseReviewDto, student: User) {
    const { courseId } = dto;
    dto.user = student;

    const reviewExist = await this.courseRepository.getCourseReview(
      courseId,
      student.id,
    );

    if (reviewExist) dto.id = reviewExist.id;

    const enrollment =
      await this.enrollmentRepository.getEnrollmentByCourseAndStudent(
        courseId,
        student.id,
      );

    if (!enrollment)
      throw new NotFoundException('You are not enrolled in the course.');

    const review = await this.courseRepository.createCourseReview(dto);

    review.course.thumbnail = this.uploadService.createCourseThumbnailLink(
      review.course.thumbnail,
    );
    // review.user.profileImage = this.uploadService.createAssetLink({
    //   publicId: review.user.profileImage,
    // });
    await this.rewardPointsService.giveRewardPoints(
      student,
      RewardPointsConditionKey.CourseReviewRate,
    );

    return review;
  }

  async listReviews(dto: ListCourseReviewsDto) {
    const r = await this.courseRepository.listReviews(dto);

    r.reviews = r.reviews.map((review) => {
      review.course.thumbnail = this.uploadService.createCourseThumbnailLink(
        review.course.thumbnail,
      );

      review.user.profileImage = this.uploadService.createUserProfileLink(
        review.user.profileImage,
      );

      return review;
    });

    return r;
  }

  async getAllCoursesIds() {
    const ids = await this.courseRepository.getAllCoursesIds();
    return ids;
  }

  private calcRatingCount(reviews: { rating: number }[], stars: number) {
    const _reviews = reviews.filter((r) => r.rating === stars);

    return _reviews.length;
  }
}
