import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Organization, User } from '@prisma/client';

import { PrismaService } from './prisma.service';
import {
  AdminCreateOrganizationDto,
  AdminListOrganizationDto,
  AdminUpdateOrganizationDto,
} from '../admin/dto/organization.dto';

@Injectable()
export class OrganizationRepository {
  private exceptionMsg: string;
  private logger = new Logger('OrganizationRepository');
  constructor(private prisma: PrismaService, private configs: ConfigService) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  /**
   * @description get organization for given instructor
   */
  async getOrgByInstrcutor(instructor: User): Promise<Organization> {
    try {
      const org = await this.prisma.organization.findFirst({
        where: { members: { some: { id: instructor.id } } },
      });
      return org;
    } catch (err) {
      this.logger.error('failed to find org', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description get organization by id
   */
  async getOrgById(id: number) {
    try {
      const org = await this.prisma.organization.findFirst({ where: { id } });
      return org;
    } catch (err) {
      this.logger.error('failed to get org by id', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description create new organizaton (by admin)
   */
  async createOrganization(dto: AdminCreateOrganizationDto) {
    const { name, coverImage, description } = dto;

    try {
      const org = await this.prisma.organization.create({
        data: { name, coverImage, description },
        select: { id: true, name: true, coverImage: true, description: true },
      });

      return org;
    } catch (err) {
      this.logger.error('failed to create organization by admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description update organizaton (by admin)
   */
  async updateOrganization(dto: AdminUpdateOrganizationDto) {
    const { id, name, coverImage, description } = dto;

    try {
      const org = await this.prisma.organization.update({
        where: { id },
        data: { name, coverImage, description },
        select: { id: true, name: true, coverImage: true, description: true },
      });

      return org;
    } catch (err) {
      this.logger.error('failed to update organization by admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description list organizaton (by admin)
   */
  async listOrganizations(dto: AdminListOrganizationDto) {
    const { page, size, search } = dto;

    try {
      const [total, organizations] = await this.prisma.$transaction([
        this.prisma.organization.count({
          where: {
            name: { contains: search },
          },
        }),
        this.prisma.organization.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: {
            name: { contains: search },
          },
        }),
      ]);
      return { total, organizations };
    } catch (err) {
      this.logger.error('failed to list organization for admin', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }
}
