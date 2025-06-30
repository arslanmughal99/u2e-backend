import {
  Logger,
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserRole, User, Organization } from '@prisma/client';

import { PrismaService } from './prisma.service';
import { defaultRights } from '../auth/rights.guard';
import {
  UpdateUserDto,
  FindInstructorDto,
  RegisterStudentDto,
  FindInstructorSortBy,
  RegisterStudentFacebookDto,
} from '../user/user.dto';
import { CreateInstructorDto } from '../organization/organization.dto';
import { AdminListUsersDto, AdminUpdateUserDto } from '../admin/dto/user.dto';

@Injectable()
export class UserRepository {
  private exceptionMsg: string;
  private logger = new Logger('UserRepository');
  constructor(private db: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  /**
   * @description Find a user by its username
   */
  async findUserByUsername(username: string) {
    try {
      const user = await this.db.user.findFirst({
        include: { organization: true },
        where: { username },
      });
      return user;
    } catch (err) {
      this.logger.error(`failed to find user by username: ${username}`, err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Find a user by its facebookid
   */
  async findUserByFacebookId(facebookid: string) {
    try {
      const user = await this.db.user.findFirst({
        include: { organization: true },
        where: { facebookId: facebookid },
      });
      return user;
    } catch (err) {
      this.logger.error(
        `failed to find user by facebookid: ${facebookid}`,
        err,
      );
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Find a user by its email
   */
  async findUserByEmail(email: string) {
    try {
      const user = await this.db.user.findFirst({
        include: { organization: true },
        where: { email },
      });
      return user;
    } catch (err) {
      this.logger.error(`failed to find user by email: ${email}`, err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async findUserById(id: number) {
    try {
      const user = await this.db.user.findFirst({
        where: { id },
        include: { organization: true },
      });
      return user;
    } catch (err) {
      this.logger.error('faield to get user by id.', err);
      this.logger.debug({ id });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getUserByFacebookId(fbId: string) {
    try {
      const user = await this.db.user.findFirst({
        where: { facebookId: fbId },
        include: { organization: true },
      });
      return user;
    } catch (err) {
      this.logger.error('faield to get user by id.', err);
      this.logger.debug({ fbId });
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Create new student
   */
  async createStudent(dto: RegisterStudentDto): Promise<User> {
    const {
      email,
      firstName,
      lastName,
      password,
      timezone,
      username,
      coverImage,
      profileImage,
    } = dto;
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password.trim(), salt);

    let exist;
    try {
      exist = await this.db.user.findFirst({ where: { username } });
    } catch (err) {
      this.logger.error('failed to find any confilicting student in db', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    if (exist) throw new ConflictException('User already exist .');

    try {
      const student = await this.db.user.create({
        data: {
          salt,
          hash,
          email,
          lastName,
          timezone,
          username,
          firstName,
          coverImage,
          profileImage,
          rights: defaultRights,
          role: UserRole.Student,
        },
      });
      return student;
    } catch (err) {
      this.logger.error('failed to insert student', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Create new student from facebook auth
   */
  async createStudentFromFacebook(
    dto: RegisterStudentFacebookDto,
  ): Promise<User> {
    const { email, lastName, firstName, facebookid } = dto;

    let exist;
    try {
      exist = await this.db.user.findFirst({
        where: { facebookId: facebookid },
      });
    } catch (err) {
      this.logger.error('failed to find any confilicting student in db', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    if (exist) throw new ConflictException('User already exist .');

    try {
      const student = await this.db.user.create({
        data: {
          email,
          salt: '',
          hash: '',
          lastName,
          timezone: '',
          firstName,
          coverImage: '',
          profileImage: '',
          rights: defaultRights,
          role: UserRole.Student,
          facebookId: facebookid,
          username: `${facebookid}`,
        },
      });

      return student;
    } catch (err) {
      this.logger.error('failed to insert student', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Update user data
   */
  async updateUser(dto: UpdateUserDto, _user: User): Promise<User> {
    const { bio, email, firstName, lastName, jobTitle, timezone } = dto;
    try {
      const user = await this.db.user.update({
        where: { id: _user.id },
        data: { bio, email, firstName, lastName, jobTitle, timezone },
      });

      return user;
    } catch (err) {
      this.logger.error(`failed to udpate user: ${_user.username}`, err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description update user password
   */
  async updateUserPassword(username: string, password: string) {
    try {
      const salt = await bcrypt.genSalt();
      const hash = await bcrypt.hash(password.trim(), salt);

      const user = await this.db.user.update({
        where: { username },
        data: { hash, salt },
      });

      delete user.salt;
      delete user.hash;
      return user;
    } catch (err) {
      this.logger.error('failed to update user password', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description create instructor by organization
   */
  async createInstructor(
    dto: CreateInstructorDto,
    _organization: Organization,
  ) {
    const {
      bio,
      email,
      lastName,
      password,
      username,
      jobTitle,
      timezone,
      firstName,
    } = dto;
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password.trim(), salt);
    let exist;
    try {
      exist = await this.db.user.findFirst({ where: { username } });
    } catch (err) {
      this.logger.error('failed to find any confilicting student in db', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }

    if (exist) throw new ConflictException('User already exist .');

    try {
      const student = await this.db.user.create({
        data: {
          bio,
          salt,
          hash,
          email,
          jobTitle,
          timezone,
          username,
          lastName,
          firstName,
          role: UserRole.Instructor,
          organizationId: _organization.id,
        },
      });
      return student;
    } catch (err) {
      this.logger.error('failed to insert instructor', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateUserAdmin(dto: AdminUpdateUserDto) {
    const {
      id,
      role,
      email,
      jobTitle,
      timezone,
      verified,
      lastName,
      firstName,
      identified,
      payoutLockTime,
      organizationId,
    } = dto;
    try {
      const user = await this.db.user.update({
        select: {
          id: true,
          bio: true,
          role: true,
          email: true,
          timezone: true,
          username: true,
          verified: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          updatedAt: true,
          createdAt: true,
          coverImage: true,
          identified: true,
          profileImage: true,
          organization: true,
          payoutLockTime: true,
        },
        where: { id },
        data: {
          role,
          email,
          lastName,
          firstName,
          jobTitle,
          timezone,
          verified,
          identified,
          payoutLockTime,
          organization:
            organizationId !== undefined
              ? organizationId === null
                ? { disconnect: true }
                : { connect: { id: organizationId } }
              : undefined,
        },
      });
      return user;
    } catch (err) {
      this.logger.error('failed to update user by admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listUsersAdmin(dto: AdminListUsersDto) {
    const { page, size, role, username, verified, identified, organizationId } =
      dto;

    try {
      const [total, users] = await this.db.$transaction([
        this.db.user.count({
          where: {
            role,
            username,
            verified,
            identified,
            organizationId,
          },
          orderBy: { id: 'desc' },
        }),
        this.db.user.findMany({
          select: {
            id: true,
            role: true,
            email: true,
            username: true,
            verified: true,
            createdAt: true,
            identified: true,
            profileImage: true,
          },
          where: {
            role,
            username,
            verified,
            identified,
            organizationId,
          },
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
        }),
      ]);

      return { total, users };
    } catch (err) {
      this.logger.error('failed to list users for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async findInstructor(dto: FindInstructorDto) {
    const { page, size, sortBy, type, maxPrice, categoryId } = dto;

    const categoryAndQuery = categoryId
      ? `AND c."categoryId"=${categoryId}`
      : '';
    const havingQuery =
      sortBy === FindInstructorSortBy.TopRated
        ? 'HAVING ROUND(AVG(r.rating), 1) > 0'
        : sortBy === FindInstructorSortBy.TopSeller
        ? 'HAVING COUNT(e) > 0'
        : '';
    const priceAndQuery = maxPrice ? `AND c.price <= ${maxPrice}` : '';
    const typeQuery =
      type === UserRole.Instructor
        ? `('${UserRole.Instructor}')`
        : type === UserRole.Organization
        ? `('${UserRole.Organization}')`
        : `('${UserRole.Instructor}', '${UserRole.Organization}')`;

    const orderByQuery =
      sortBy === FindInstructorSortBy.TopRated
        ? 'ORDER BY reviews DESC'
        : sortBy === FindInstructorSortBy.TopSeller
        ? 'ORDER BY enrollments DESC'
        : 'ORDER BY u.id DESC';

    const countQuery = `
        SELECT 
        COUNT(DISTINCT u.id) as total
        FROM "User" u
        LEFT JOIN "Course" c ON u.id=c."instructorId"
        LEFT JOIN "Enrollment" e ON e."courseId"=c.id
        LEFT JOIN "Review" r ON r."courseId"=c."instructorId"
        WHERE u.role IN ${typeQuery} 
        ${priceAndQuery}
        ${havingQuery}
        ${categoryAndQuery}
       ;
        `;
    const query = `
        SELECT 
        DISTINCT u.id,
        u.username,
        u.fullname,
        u.bio,
        u.profile_image AS "profileImage",
        COUNT(e) AS enrollments,
        ROUND(AVG(r.rating),1) AS reviews
        FROM "User" u
        LEFT JOIN "Course" c ON u.id=c."instructorId"
        LEFT JOIN "Enrollment" e ON e."courseId"=c.id
        LEFT JOIN "Review" r ON r."courseId"=c."instructorId"
        WHERE u.role IN ${typeQuery} 
        ${priceAndQuery}
        GROUP BY u.id
        ${havingQuery}
        ${categoryAndQuery}
        ${orderByQuery}
        OFFSET ${(page - 1) * size}
        LIMIT ${size}
       ;
        `;

    const [count, instructors] = await this.db.$transaction([
      this.db.$queryRawUnsafe(countQuery),
      this.db.$queryRawUnsafe(query),
    ]);

    return {
      total: (count as any)[0].total as number,
      instructors: instructors as {
        id: number;
        bio: string;
        reviews: string;
        username: string;
        fullname: string;
        enrollments: string;
        profileImage: string;
      }[],
    };
  }

  // async addRewardPoints(points: number, user: Partial<User>) {
  //   try {
  //     const u = await this.db.user.update({
  //       where: { id: user.id },
  //       data: { rewardPoints: { increment: points } },
  //     });
  //     return u;
  //   } catch (err) {
  //     this.logger.error('failed to add reward points', err);
  //     this.logger.debug({ points, username: user.username });
  //     return false;
  //   }
  // }
}
