import {
  Logger,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { reduce, round } from 'lodash';
import { ConfigService } from '@nestjs/config';
import { User, Course, Prisma, AssociateInvitation } from '@prisma/client';

import {
  CourseType,
  CreateCourseDto,
  UpdateCourseDto,
  PublishCourseDto,
  ListCourseReviewsDto,
  ListPublicCoursesDto,
  CreateCourseReviewDto,
  ListEnrolledCoursesDto,
  ListInstructorCoursesDto,
  GetEnrolledCourseByIdDto,
} from '../course/course.dto';
import {
  AdminListCoursesDto,
  AdminUpdateCourseDto,
} from '../admin/dto/course.dto';
import { PrismaService } from './prisma.service';
import { ListAssociateInvitesDto } from '../associate/associates.dto';
import { CourseFAQs, CourseRequirements } from '../course/course.typings';

@Injectable()
export class CourseRepository {
  private exceptionMsg: string;
  private maxPopularCourses: number;
  private maxBestSellerCourse: number;
  private logger = new Logger('CourseRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
    this.maxPopularCourses = parseInt(
      this.configs.get('MAX_POPULAR_COURSES_LIST'),
    );
    this.maxBestSellerCourse = parseInt(
      this.configs.get('MAX_BEST_SELLER_COURSE_LIST'),
    );
  }

  /**
   * @description Create new course
   */
  async createCourse(dto: CreateCourseDto) {
    const {
      faqs,
      title,
      price,
      thumbnail,
      description,
      billingType,
      requirements,
      forOrganization,
      instructor,
      _category,
    } = dto;

    const data: Prisma.CourseUncheckedCreateInput = {
      title,
      price,
      thumbnail,
      billingType,
      description,
      published: false,
      requirements: requirements?.map(
        ({ required, requirement }) =>
          ({ required, requirement } as CourseRequirements),
      ),
      categoryId: _category.id,
      organizationId: instructor.organizationId,
      faqs: faqs?.map(({ title, answer }) => ({ title, answer } as CourseFAQs)),
    };

    if (forOrganization && !instructor.organizationId)
      throw new NotFoundException('You are not connected to organization.');

    if (forOrganization) {
      data.organizationId = instructor.organizationId;
    } else {
      data.instructorId = instructor.id;
    }

    try {
      const course = await this.prisma.course.create({
        select: {
          id: true,
          faqs: true,
          price: true,
          title: true,
          thumbnail: true,
          published: true,
          createdAt: true,
          requirements: true,
          billingType: true,
          description: true,
          category: {
            select: {
              id: true,
              icon: true,
              title: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              coverImage: true,
              description: true,
            },
          },
        },
        data,
      });

      return course;
    } catch (err) {
      this.logger.error('failed to insert course', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Update course details by creator or associate of the course
   */
  async updateCourse(dto: UpdateCourseDto) {
    const {
      id,
      faqs,
      title,
      price,
      thumbnail,
      // published,
      instructor,
      _category,
      billingType,
      description,
      requirements,
    } = dto;

    let isOwnedOrAssociated = 0;
    try {
      // check if course is owned by instructor or associated with course
      // >1 === allowed else not allowed
      isOwnedOrAssociated = await this.prisma.course.count({
        where: {
          id,
          OR: [
            { instructorId: instructor.id },
            { associates: { some: { instructorId: instructor.id } } },
          ],
        },
      });
    } catch (err) {
      this.logger.error(
        `failed to check course update associate for course id: ${id}`,
        err,
      );
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    if (isOwnedOrAssociated <= 0)
      throw new UnauthorizedException("Course don't belongs to you.");

    try {
      const course = await this.prisma.course.update({
        where: { id },
        select: {
          id: true,
          faqs: true,
          price: true,
          title: true,
          thumbnail: true,
          published: true,
          createdAt: true,
          billingType: true,
          description: true,
          requirements: true,
          category: {
            select: {
              id: true,
              icon: true,
              title: true,
            },
          },
          organization: {
            select: {
              id: true,
              name: true,
              coverImage: true,
              description: true,
            },
          },
        },
        data: {
          title,
          price,
          thumbnail,
          billingType,
          description,
          requirements: requirements?.map(
            ({ required, requirement }) =>
              ({ required, requirement } as CourseRequirements),
          ),
          faqs: faqs?.map(
            ({ title, answer }) => ({ title, answer } as CourseFAQs),
          ),
          categoryId: _category.id,
        },
        // include: { instructor: true, organization: true },
      });

      return course;
    } catch (err) {
      this.logger.error(`failed to update course id: ${id}`, err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Update course details by creator or associate of the course
   */
  async publishCourse(dto: PublishCourseDto) {
    const { id } = dto;

    try {
      const course = await this.prisma.course.update({
        where: { id },
        select: {
          id: true,
          published: true,
        },
        data: {
          published: true,
        },
      });

      return course;
    } catch (err) {
      this.logger.error(`failed to publish course id: ${id}`, err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description find course by id and (associate or instructor)
   */
  async findCourseByIdAndAssociate(id: number, instructor: User) {
    try {
      const course = await this.prisma.course.findFirst({
        where: {
          id,
          OR: [
            {
              instructorId: instructor.id,
            },
            {
              associates: { some: { instructorId: instructor.id } },
            },
          ],
        },
      });
      return course;
    } catch (err) {
      this.logger.error(`failed to find course by id: ${id}`, err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Create invite for other instructor to join course as associate
   */
  async createAssociateInvite(dto: {
    associate: User;
    course: Partial<Course>;
  }) {
    const { associate, course } = dto;

    try {
      const invite = await this.prisma.associateInvitation.create({
        data: { courseId: course.id, instructorId: associate.id },
      });

      return invite;
    } catch (err) {
      this.logger.error('failed to create associate invite', err);
      this.logger.debug({ courseId: course.id, associateId: associate.id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description List associated invites for instructor
   */
  async listAssociateInvites(dto: ListAssociateInvitesDto, instructor: User) {
    const { page, size, search } = dto;

    try {
      const [total, _invites] = await this.prisma.$transaction([
        this.prisma.associateInvitation.count({
          orderBy: { accepted: 'desc' },
          where: {
            instructorId: instructor.id,
            course: { title: { mode: 'insensitive', contains: search } },
          },
        }),
        this.prisma.associateInvitation.findMany({
          orderBy: { accepted: 'desc' },
          where: {
            instructorId: instructor.id,
            course: { title: { mode: 'insensitive', contains: search } },
          },
          take: size,
          skip: (page - 1) * size,
          include: { course: true },
        }),
      ]);

      const invites = _invites.map((i) => {
        return {
          id: i.id,
          accepted: i.accepted,
          course: { id: i.course.id, title: i.course.title },
        };
      });

      return { total, invites };
    } catch (err) {
      this.logger.error(
        `failed to fetch associate invite for user: ${instructor.username}`,
        err,
      );

      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param id invitation id
   * @description Get invite by id and user
   * @param instructor instructor to which it belongs
   */
  async getAssociateInviteByIdAndUser(id: number, instructor: User) {
    let invite: AssociateInvitation;

    try {
      invite = await this.prisma.associateInvitation.findFirst({
        where: { id, instructorId: instructor.id },
      });
      return invite;
    } catch (err) {
      this.logger.error(
        `failed to find invitation ${id} for instructor: ${instructor.username}`,
        err,
      );

      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param courseId Course if
   * @param instructor Instructor
   * @description Get invite by courseid and instructor to which it belongs
   */
  async getAssociateInviteByCourseAndUser(courseId: number, instructor: User) {
    let invite: AssociateInvitation;

    try {
      invite = await this.prisma.associateInvitation.findFirst({
        where: { instructorId: instructor.id, courseId },
      });
      return invite;
    } catch (err) {
      this.logger.error(
        `failed to find invitation by courseId ${courseId} for instructor: ${instructor.username}`,
        err,
      );

      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param id invitation id
   * @param accepted either accepted or not
   * @param instructor instructor to which invite belongs
   * @description update associate invite by user and invite id
   */
  async updateAssociateInvite(invite: AssociateInvitation, accepted: boolean) {
    try {
      const updatedInvite = await this.prisma.associateInvitation.update({
        data: { accepted },
        where: { id: invite.id },
      });
      return updatedInvite;
    } catch (err) {
      this.logger.error(
        `failed to update associate invite id: ${invite.id}`,
        err,
      );
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Create course association to instructor
   * @param courseId Course id that will associate with instructor
   * @param instructor Instructor to which course will associate
   */
  async createCourseAssociate(courseId: number, instructor: User) {
    try {
      const associated = await this.prisma.associate.create({
        data: { courseId, instructorId: instructor.id },
        include: {
          course: { include: { instructor: true } },
          instructor: true,
        },
      });

      return associated;
    } catch (err) {
      this.logger.error(
        `failed to create course association for course: ${courseId} for instructor: ${instructor.username}`,
        err,
      );

      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description List instructor courses
   */
  async listInstrucorCourses(dto: ListInstructorCoursesDto, instructor: User) {
    const { page, size, search, courseType, categoryId } = dto;

    const typeFilter = courseType || CourseType.All;

    try {
      const [total, courses] = await this.prisma.$transaction([
        this.prisma.course.count({
          where: {
            categoryId,
            title: { mode: 'insensitive', contains: search },
            organization:
              typeFilter === CourseType.All
                ? undefined
                : typeFilter === CourseType.Organization
                ? { isNot: null }
                : { is: null },
            OR: [
              {
                instructorId: instructor.id,
              },
              {
                associates: { some: { instructorId: instructor.id } },
              },
            ],
          },
        }),
        this.prisma.course.findMany({
          take: size,
          skip: (page - 1) * size,
          select: {
            id: true,
            price: true,
            title: true,
            published: true,
            thumbnail: true,
            createdAt: true,
            description: true,
            category: {
              select: {
                id: true,
                icon: true,
                title: true,
              },
            },
            associates: {
              select: {
                instructor: {
                  select: {
                    id: true,
                    lastName: true,
                    firstName: true,
                    profileImage: true,
                  },
                },
              },
            },
            organization: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          where: {
            categoryId,
            title: { mode: 'insensitive', contains: search },
            organization:
              typeFilter === CourseType.All
                ? undefined
                : typeFilter === CourseType.Organization
                ? { isNot: null }
                : { is: null },
            OR: [
              {
                instructorId: instructor.id,
              },
              {
                associates: { some: { instructorId: instructor.id } },
              },
            ],
          },
        }),
      ]);

      return { total, courses };
    } catch (err) {
      this.logger.error(
        `failed to get courses for instructor: ${instructor.username}`,
        err,
      );
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description List public courses
   */
  async listCourses(dto: ListPublicCoursesDto, user?: User) {
    const { page, size, search, courseType, categoryId } = dto;

    const typeFilter = courseType || CourseType.All;

    try {
      const [total, _courses] = await this.prisma.$transaction([
        this.prisma.course.count({
          where: {
            categoryId,
            deleted: false,
            approved: true,
            published: true,
            organization:
              typeFilter === CourseType.All
                ? undefined
                : typeFilter === CourseType.Organization
                ? { isNot: null }
                : { is: null },
            title: { mode: 'insensitive', contains: search },
          },
        }),
        this.prisma.course.findMany({
          take: size,
          skip: (page - 1) * size,
          where: {
            categoryId,
            approved: true,
            deleted: false,
            published: true,
            organization:
              typeFilter === CourseType.All
                ? undefined
                : typeFilter === CourseType.Organization
                ? { isNot: null }
                : { is: null },
            title: { mode: 'insensitive', contains: search },
          },
          select: {
            id: true,
            title: true,
            price: true,
            lectures: true,
            createdAt: true,
            thumbnail: true,
            category: {
              select: {
                id: true,
                icon: true,
                title: true,
              },
            },
            description: true,
            billingType: true,
            instructor: {
              select: {
                id: true,
                username: true,
                lastName: true,
                firstName: true,
                profileImage: true,
              },
            },
            reviews: { select: { rating: true } },
            associates: {
              select: {
                instructor: {
                  select: {
                    id: true,
                    lastName: true,
                    firstName: true,
                    profileImage: true,
                  },
                },
              },
            },
            enrollments: user
              ? {
                  where: { studentId: user.id },
                }
              : false,
            _count: { select: { lectures: true } },
            organization: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const courses = _courses.map((c) => {
        // Calculating average rating
        // It is more convinient and efficient to calculate
        // in application layer rather then Db layer
        (c as any).rating =
          c.reviews.length > 0
            ? round(
                c.reviews.reduce((sum, rating) => {
                  sum.rating = sum.rating + rating.rating;
                  return sum;
                }).rating / c.reviews.length,
                2,
              )
            : 0;

        (c as any).lectures = c._count.lectures;
        if (c.enrollments) {
          if (c.enrollments.length >= 1) {
            (c as any).enrolled = { expiry: c.enrollments[0].expiry };
          }
          delete c.enrollments;
        }

        delete c.reviews;
        delete c._count;
        return c;
      });

      return { total, courses };
    } catch (err) {
      this.logger.error('failed to get courses', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description List enrolled courses
   */
  async listEnrolledCourses(dto: ListEnrolledCoursesDto, student: User) {
    const { page, size, search, status, courseType, categoryId } = dto;

    const typeFilter = courseType || CourseType.All;

    try {
      const [total, _courses] = await this.prisma.$transaction([
        this.prisma.course.count({
          where: {
            categoryId,
            organization:
              typeFilter === CourseType.All
                ? undefined
                : typeFilter === CourseType.Organization
                ? { isNot: null }
                : { is: null },
            title: { mode: 'insensitive', contains: search },
            enrollments: { some: { studentId: student.id, status } },
          },
        }),
        this.prisma.course.findMany({
          take: size,
          skip: (page - 1) * size,
          where: {
            categoryId,
            organization:
              typeFilter === CourseType.All
                ? undefined
                : typeFilter === CourseType.Organization
                ? { isNot: null }
                : { is: null },
            title: { mode: 'insensitive', contains: search },
            enrollments: { some: { studentId: student.id, status } },
          },
          select: {
            id: true,
            title: true,
            category: {
              select: {
                id: true,
                icon: true,
                title: true,
              },
            },
            lectures: { select: { lectureProgresses: true, duration: true } },
            createdAt: true,
            thumbnail: true,
            description: true,
            billingType: true,
            instructor: {
              select: {
                id: true,
                lastName: true,
                username: true,
                firstName: true,
                profileImage: true,
              },
            },
            associates: {
              select: {
                instructor: {
                  select: {
                    id: true,
                    lastName: true,
                    firstName: true,
                    profileImage: true,
                  },
                },
              },
            },
            reviews: { where: { userId: student.id } },
            certificates: {
              where: { userId: student.id },
              select: { id: true, createdAt: true },
            },
            enrollments: {
              where: { studentId: student.id },
              select: { id: true, expiry: true },
            },
            _count: { select: { lectures: true } },
            organization: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const courses = _courses.map((c) => {
        const totalCourseLength = reduce(
          c.lectures,
          (t, cval) => {
            t += cval.duration;
            return t;
          },
          0,
        );

        const currentProgress = reduce(
          c.lectures,
          (c, l) => {
            if (l.lectureProgresses.length <= 0) return c;

            const prog = l.lectureProgresses[0];
            if (prog.completed) return (c += l.duration);

            return (c += prog.progress);
          },
          0,
        );

        delete c.lectures;

        if (c.certificates.length > 0)
          (c as any).certificate = c.certificates[0];

        delete c.certificates;

        if (c.reviews.length > 0) {
          const r = c.reviews[0];
          (c as any).review = { rating: r.rating, review: r.review };
        }
        delete c.reviews;

        (c as any).progress = Math.ceil(
          (currentProgress / totalCourseLength) * 100,
        );
        (c as any).lectures = c._count.lectures;
        if (c.enrollments) {
          if (c.enrollments.length >= 1) {
            (c as any).enrolled = {
              id: c.enrollments[0].id,
              expiry: c.enrollments[0].expiry,
            };
          }
          delete c.enrollments;
        }
        delete c._count;
        return c;
      });

      return { total, courses };
    } catch (err) {
      this.logger.error('failed to get courses', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param ids courses ids
   * @description Get courses by ids
   */
  async getCoursesByIds(ids: number[]) {
    try {
      const courses = await this.prisma.course.findMany({
        where: {
          id: { in: ids },
          deleted: false,
          approved: true,
          published: true,
        },
      });
      return courses;
    } catch (err) {
      this.logger.error('failed to get courses by ids', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param ids course id
   * @description Get course by id
   */
  async getCourseById(id: number, user?: User) {
    try {
      const course = await this.prisma.course.findFirst({
        where: { id, deleted: false },
        select: {
          id: true,
          faqs: true,
          title: true,
          price: true,
          approved: true,
          thumbnail: true,
          published: true,
          createdAt: true,
          description: true,
          requirements: true,
          objectives: true,
          category: {
            select: {
              id: true,
              icon: true,
              title: true,
            },
          },
          instructor: {
            select: {
              id: true,
              username: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
          billingType: true,
          reviews: { select: { rating: true } },
          associates: {
            select: {
              instructor: {
                select: {
                  id: true,
                  lastName: true,
                  firstName: true,
                  profileImage: true,
                },
              },
            },
          },
          enrollments: user
            ? {
                where: { studentId: user.id },
              }
            : false,
          _count: {
            select: { lectures: true, reviews: true, enrollments: true },
          },
          organization: { select: { id: true, name: true } },
        },
      });

      if (!course) return;

      (course as any).lectures = course._count.lectures;
      if (course.enrollments) {
        if (course.enrollments.length >= 1) {
          (course as any).enrolled = {
            expiry: course.enrollments[0].expiry,
          };
        }
        delete course.enrollments;
      }
      // delete course._count;
      // Calculating average rating
      // It is more convinient and efficient to calculate
      // in application layer rather then Db layer
      (course as any).rating =
        course.reviews.length > 0
          ? round(
              course.reviews.reduce((sum, rating) => {
                sum.rating = sum.rating + rating.rating;
                return sum;
              }).rating / course.reviews.length,
              2,
            )
          : 0;

      (course as any).lectures = course._count.lectures;
      (course as any).students = course._count.enrollments;
      (course as any).reviews = course._count.reviews;
      if (course.enrollments) {
        if (course.enrollments.length >= 1) {
          (course as any).enrolled = { expiry: course.enrollments[0].expiry };
        }
        delete course.enrollments;
      }

      // delete course.reviews;
      delete course._count;

      return course;
    } catch (err) {
      this.logger.error('failed to get course by id', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param ids course id
   * @description Get course by id
   */
  async getCourseDetailsById(id: number) {
    try {
      const course = await this.prisma.course.findFirst({
        where: { id, deleted: false, published: true, approved: true },
        select: {
          id: true,
          faqs: true,
          title: true,
          price: true,
          thumbnail: true,
          createdAt: true,
          description: true,
          requirements: true,
          objectives: true,
          category: {
            select: {
              id: true,
              icon: true,
              title: true,
            },
          },

          instructor: {
            select: {
              id: true,
              username: true,
              lastName: true,
              firstName: true,
              bio: true,
              profileImage: true,
            },
          },
          billingType: true,
          lectureGroups: {
            orderBy: [{ index: 'asc' }],
            where: {
              course: {
                id,
                approved: true,
                published: true,
              },
            },
            select: {
              title: true,
              index: true,
              lectures: {
                select: {
                  id: true,
                  video: true,
                  title: true,
                  index: true,
                  instructor: {
                    select: {
                      id: true,
                      lastName: true,
                      firstName: true,
                      username: true,
                      profileImage: true,
                    },
                  },
                  preview: true,
                  duration: true,
                  thumbnail: true,
                },
                orderBy: [{ index: 'asc' }],
              },
            },
          },
          reviews: { select: { rating: true } },
          associates: {
            select: {
              instructor: {
                select: {
                  id: true,
                  lastName: true,
                  firstName: true,
                  profileImage: true,
                },
              },
            },
          },
          _count: {
            select: { lectures: true, enrollments: true, reviews: true },
          },
          organization: { select: { id: true, name: true } },
        },
      });

      if (!course) return;

      const reviews = await this.prisma.review.aggregate({
        _sum: { rating: true },
        _count: { review: true },
        where: { course: { instructorId: course.instructor.id } },
      });
      const enrollments = await this.prisma.enrollment.aggregate({
        _count: { id: true },
        where: { course: { instructorId: course.instructor.id } },
      });
      const courses = await this.prisma.course.aggregate({
        _count: { id: true },
        where: { instructorId: course.instructor.id },
      });

      (course.instructor as any).rating = round(
        reviews._sum.rating / reviews._count.review,
        1,
      );
      (course.instructor as any).courses = courses._count.id;
      (course.instructor as any).reviews = reviews._count.review;
      (course.instructor as any).enrollments = enrollments._count.id;

      // delete course._count;
      // Calculating average rating
      // It is more convinient and efficient to calculate
      // in application layer rather then Db layer
      // (course as any).rating =
      //   course.reviews.length > 0
      //     ? round(
      //         course.reviews.reduce((sum, rating) => {
      //           sum.rating = sum.rating + rating.rating;
      //           return sum;
      //         }).rating / course.reviews.length,
      //         2,
      //       )
      //     : 0;

      (course as any).lecturesCount = course._count.lectures;
      (course as any).students = course._count.enrollments;
      // (course as any).reviews = course._count.reviews;

      // delete course.reviews;
      delete course._count;

      return course;
    } catch (err) {
      this.logger.error('failed to get course by id with lectures', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
  /**
   * @param ids course id
   * @description Get course by id for enrolled student
   */
  async getEnrolledCourseDetailsById(dto: GetEnrolledCourseByIdDto) {
    const { id, student } = dto;

    try {
      const course = await this.prisma.course.findFirst({
        where: {
          id,
          deleted: false,
          published: true,
          approved: true,
          enrollments: { some: { studentId: student.id } },
        },
        select: {
          id: true,
          faqs: true,
          title: true,
          price: true,
          thumbnail: true,
          createdAt: true,
          description: true,
          requirements: true,
          objectives: true,
          category: {
            select: {
              id: true,
              icon: true,
              title: true,
            },
          },

          instructor: {
            select: {
              id: true,
              username: true,
              lastName: true,
              firstName: true,
              bio: true,
              profileImage: true,
            },
          },
          billingType: true,
          lectureGroups: {
            orderBy: [{ index: 'asc' }],
            where: {
              course: {
                id,
                approved: true,
                published: true,
              },
            },
            select: {
              title: true,
              index: true,
              lectures: {
                select: {
                  id: true,
                  // video: true,
                  title: true,
                  index: true,
                  instructor: {
                    select: {
                      id: true,
                      lastName: true,
                      firstName: true,
                      username: true,
                      profileImage: true,
                    },
                  },
                  preview: true,
                  duration: true,
                  thumbnail: true,
                },
                orderBy: [{ index: 'asc' }],
              },
            },
          },
          reviews: { select: { rating: true } },
          associates: {
            select: {
              instructor: {
                select: {
                  id: true,
                  lastName: true,
                  firstName: true,
                  profileImage: true,
                },
              },
            },
          },
          _count: {
            select: { lectures: true, enrollments: true, reviews: true },
          },
          organization: { select: { id: true, name: true } },
        },
      });

      if (!course) return;

      const reviews = await this.prisma.review.aggregate({
        _sum: { rating: true },
        _count: { review: true },
        where: { course: { instructorId: course.instructor.id } },
      });
      const enrollments = await this.prisma.enrollment.aggregate({
        _count: { id: true },
        where: { course: { instructorId: course.instructor.id } },
      });
      const courses = await this.prisma.course.aggregate({
        _count: { id: true },
        where: { instructorId: course.instructor.id },
      });

      (course.instructor as any).rating = round(
        reviews._sum.rating / reviews._count.review,
        1,
      );
      (course.instructor as any).courses = courses._count.id;
      (course.instructor as any).reviews = reviews._count.review;
      (course.instructor as any).enrollments = enrollments._count.id;

      // delete course._count;
      // Calculating average rating
      // It is more convinient and efficient to calculate
      // in application layer rather then Db layer
      // (course as any).rating =
      //   course.reviews.length > 0
      //     ? round(
      //         course.reviews.reduce((sum, rating) => {
      //           sum.rating = sum.rating + rating.rating;
      //           return sum;
      //         }).rating / course.reviews.length,
      //         2,
      //       )
      //     : 0;

      (course as any).lecturesCount = course._count.lectures;
      (course as any).students = course._count.enrollments;
      // (course as any).reviews = course._count.reviews;

      // delete course.reviews;
      delete course._count;

      return course;
    } catch (err) {
      this.logger.error('failed to get course by id with lectures', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param ids courses ids
   * @description Get courses by ids
   */
  async getCoursesByIdsAndInstructor(ids: number[], instructor: User) {
    try {
      const courses = await this.prisma.course.findMany({
        where: { id: { in: ids }, instructorId: instructor.id },
      });
      return courses;
    } catch (err) {
      this.logger.error('failed to get courses by ids', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  // create course review
  async createCourseReview(dto: CreateCourseReviewDto) {
    const { id, rating, review, courseId, user } = dto;

    try {
      const _review = await this.prisma.review.upsert({
        select: {
          id: true,
          rating: true,
          review: true,
          course: { select: { id: true, title: true, thumbnail: true } },
        },
        update: { rating, review },
        where: { id: id ?? -1, courseId, userId: user.id },
        create: { rating, review, courseId, userId: user.id },
      });

      return _review;
    } catch (err) {
      this.logger.error('failed to create review.', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  // get course review
  async getCourseReview(courseId: number, userId: number) {
    try {
      const review = await this.prisma.review.findFirst({
        where: { courseId, userId, delete: false },
      });

      return review;
    } catch (err) {
      this.logger.error('failed to get course review.', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listReviews(dto: ListCourseReviewsDto) {
    const { page, size, rating, courseId } = dto;

    try {
      const [total, reviews] = await this.prisma.$transaction([
        this.prisma.review.count({ where: { rating, courseId } }),
        this.prisma.review.findMany({
          take: size,
          skip: (page - 1) * size,
          select: {
            id: true,
            rating: true,
            review: true,
            course: { select: { id: true, title: true, thumbnail: true } },
            user: {
              select: { id: true, username: true, profileImage: true },
            },
          },
          where: { rating, courseId },
        }),
      ]);

      return { total, reviews };
    } catch (err) {
      this.logger.error('failed to list reviews', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getPopularCourses(user?: User) {
    let popularCourseIds: number[] = [];
    try {
      const selectedCoursesIds: { id: number; rating: number }[] = await this
        .prisma.$queryRaw`
      SELECT C.ID,
      COALESCE(ROUND(AVG(R.RATING),2),0) AS RATING
      FROM "Course" C
      LEFT JOIN "Review" R ON C.ID = R."courseId"
      WHERE C.PUBLISHED = TRUE 
      AND C.DELETED = FALSE 
      AND C.APPROVED = TRUE
      GROUP BY C.ID
      ORDER BY RATING DESC
      OFFSET 0
      LIMIT ${this.maxPopularCourses};
    `;
      popularCourseIds = selectedCoursesIds.map((ir) => ir.id);
    } catch (err) {
      this.logger.error('failed to find popular course ids.');
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    try {
      const _courses = await this.prisma.course.findMany({
        where: { id: { in: popularCourseIds } },
        select: {
          id: true,
          title: true,
          price: true,
          lectures: true,
          createdAt: true,
          thumbnail: true,
          category: true,
          description: true,
          billingType: true,
          reviews: { select: { rating: true } },
          instructor: {
            select: {
              id: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
          associates: {
            select: {
              instructor: {
                select: {
                  id: true,
                  lastName: true,
                  firstName: true,
                  profileImage: true,
                },
              },
            },
          },
          enrollments: user
            ? {
                where: { studentId: user.id },
              }
            : false,
          _count: { select: { lectures: true } },
          organization: { select: { id: true, name: true } },
        },
      });

      const courses = _courses
        .map((c) => {
          // Calculating average rating
          // It is more convinient and efficient to calculate
          // in application layer rather then Db layer
          (c as any).rating =
            c.reviews.length > 0
              ? round(
                  c.reviews.reduce((sum, rating) => {
                    sum.rating = sum.rating + rating.rating;
                    return sum;
                  }).rating / c.reviews.length,
                  2,
                )
              : 0;

          (c as any).lectures = c._count.lectures;
          if (c.enrollments) {
            if (c.enrollments.length >= 1) {
              (c as any).enrolled = { expiry: c.enrollments[0].expiry };
            }
            delete c.enrollments;
          }

          delete c.reviews;
          delete c._count;
          return c;
        })
        .sort((a: any, b: any) => a.rating - b.rating)
        .reverse();

      return { courses };
    } catch (err) {
      this.logger.error('failed to find popular course ids.');
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getBestSellingCourses(user: User) {
    const _courses = await this.prisma.course.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        lectures: true,
        createdAt: true,
        thumbnail: true,
        category: true,
        description: true,
        billingType: true,
        instructor: {
          select: {
            id: true,
            username: true,
            lastName: true,
            firstName: true,
            profileImage: true,
          },
        },
        reviews: { select: { rating: true } },
        associates: {
          select: {
            instructor: {
              select: {
                id: true,
                lastName: true,
                firstName: true,
                profileImage: true,
              },
            },
          },
        },
        enrollments: user
          ? {
              where: { studentId: user.id },
            }
          : false,
        _count: { select: { lectures: true } },
        organization: { select: { id: true, name: true } },
      },
      take: this.maxBestSellerCourse,
      where: { deleted: false, published: true, approved: true },
      orderBy: { enrollments: { _count: 'desc' } },
    });

    const courses = _courses
      .map((c) => {
        // Calculating average rating
        // It is more convinient and efficient to calculate
        // in application layer rather then Db layer
        (c as any).rating =
          c.reviews.length > 0
            ? round(
                c.reviews.reduce((sum, rating) => {
                  sum.rating = sum.rating + rating.rating;
                  return sum;
                }).rating / c.reviews.length,
                2,
              )
            : 0;

        (c as any).lectures = c._count.lectures;
        if (c.enrollments) {
          if (c.enrollments.length >= 1) {
            (c as any).enrolled = { expiry: c.enrollments[0].expiry };
          }
          delete c.enrollments;
        }

        delete c.reviews;
        delete c._count;
        return c;
      })
      .sort((a: any, b: any) => a.rating - b.rating)
      .reverse();

    return { courses };
  }

  /**
   * @description List courses for admin
   */
  async adminListCourses(dto: AdminListCoursesDto) {
    const { page, size, search, courseType, approved, categoryId } = dto;

    const typeFilter = courseType || CourseType.All;

    try {
      const [total, _courses] = await this.prisma.$transaction([
        this.prisma.course.count({
          where: {
            approved,
            categoryId,
            deleted: false,
            published: true,
            organization:
              typeFilter === CourseType.All
                ? undefined
                : typeFilter === CourseType.Organization
                ? { isNot: null }
                : { is: null },
            title: { mode: 'insensitive', contains: search },
          },
        }),
        this.prisma.course.findMany({
          take: size,
          skip: (page - 1) * size,
          where: {
            approved,
            categoryId,
            deleted: false,
            published: true,
            organization:
              typeFilter === CourseType.All
                ? undefined
                : typeFilter === CourseType.Organization
                ? { isNot: null }
                : { is: null },
            title: { mode: 'insensitive', contains: search },
          },
          select: {
            id: true,
            title: true,
            price: true,
            approved: true,
            lectures: true,
            createdAt: true,
            thumbnail: true,
            category: {
              select: {
                id: true,
                icon: true,
                title: true,
              },
            },
            description: true,
            billingType: true,
            reviews: { select: { rating: true } },
            associates: {
              select: {
                instructor: {
                  select: {
                    id: true,
                    lastName: true,
                    firstName: true,
                    profileImage: true,
                  },
                },
              },
            },
            _count: { select: { lectures: true } },
            organization: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const courses = _courses.map((c) => {
        // Calculating average rating
        // It is more convinient and efficient to calculate
        // in application layer rather then Db layer
        (c as any).rating =
          c.reviews.length > 0
            ? round(
                c.reviews.reduce((sum, rating) => {
                  sum.rating = sum.rating + rating.rating;
                  return sum;
                }).rating / c.reviews.length,
                2,
              )
            : 0;

        (c as any).lectures = c._count.lectures;

        delete c.reviews;
        delete c._count;
        return c;
      });

      return { total, courses };
    } catch (err) {
      this.logger.error('failed to get courses for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @param ids course id
   * @description Get course by id for admin
   */
  async adminGetCourseById(id: number) {
    try {
      const course = await this.prisma.course.findFirst({
        where: { id, deleted: false },
        select: {
          id: true,
          title: true,
          price: true,
          category: {
            select: {
              id: true,
              icon: true,
              title: true,
            },
          },
          createdAt: true,
          approved: true,
          thumbnail: true,
          published: true,
          description: true,
          instructor: {
            select: {
              id: true,
              username: true,
              lastName: true,
              firstName: true,
              profileImage: true,
            },
          },
          billingType: true,
          associates: {
            select: {
              instructor: {
                select: {
                  id: true,
                  lastName: true,
                  firstName: true,
                  profileImage: true,
                },
              },
            },
          },
          _count: { select: { lectures: true } },
          organization: { select: { id: true, name: true } },
        },
      });

      (course as any).lectures = course._count.lectures;
      delete course._count;
      return course;
    } catch (err) {
      this.logger.error('failed to get course by id for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description update course by admin
   */
  async adminUpdateCourse(dto: AdminUpdateCourseDto) {
    const { id, approved } = dto;
    try {
      const course = await this.prisma.course.update({
        select: {
          id: true,
          price: true,
          title: true,
          category: {
            select: {
              id: true,
              icon: true,
              title: true,
            },
          },
          thumbnail: true,
          approved: true,
          published: true,
          createdAt: true,
          billingType: true,
          description: true,
          organization: {
            select: {
              id: true,
              name: true,
              coverImage: true,
              description: true,
            },
          },
        },
        where: { id },
        data: { approved },
      });

      return course;
    } catch (err) {
      this.logger.error('failed to update course by admin', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description used to generate static pages for courses
   */
  async getAllCoursesIds() {
    const ids = await this.prisma.course.findMany({
      select: { id: true },
      where: { deleted: false, published: true, approved: true },
    });

    return ids;
  }
}
