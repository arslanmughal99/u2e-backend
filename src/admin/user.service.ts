import { isNull } from 'lodash';
import { UserRole } from '@prisma/client';
import { isNumber } from 'class-validator';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  AdminListUsersDto,
  AdminUpdateUserDto,
  AdminGetUserInfoDto,
  AdminResetUserPasswordDto,
} from './dto/user.dto';
import { UserRepository } from '../repository/user.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';
import { OrganizationRepository } from '../repository/organization.repository';

@Injectable()
export class AdminUserService {
  constructor(
    private userRepository: UserRepository,
    private orgRepository: OrganizationRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async getUserById(dto: AdminGetUserInfoDto) {
    const { id } = dto;

    const user = await this.userRepository.findUserById(id);
    user.profileImage = this.uploadService.createUserProfileLink(
      user.profileImage,
    );

    user.coverImage = this.uploadService.createUserCoverLink(user.coverImage);

    if (user.organization && user.organization.coverImage) {
      user.organization.coverImage = this.uploadService.createUserCoverLink(
        user.organization.coverImage,
      );
    }

    delete user.salt;
    delete user.hash;
    delete user.rights;
    delete user.organizationId;

    return user;
  }

  async resetPassword(dto: AdminResetUserPasswordDto) {
    const { username, password } = dto;
    await this.userRepository.updateUserPassword(username, password);
  }

  async updateUser(dto: AdminUpdateUserDto) {
    const { id, organizationId, role } = dto;

    if (role !== UserRole.Organization) {
      dto.organizationId = null;
    }

    if (role === UserRole.Organization && isNumber(organizationId)) {
      dto.role = UserRole.Organization;
      const org = await this.orgRepository.getOrgById(organizationId);
      if (!org) throw new NotFoundException('Organization not found .');
    } else if (isNull(organizationId)) {
      dto.organizationId = null;
    } else {
      dto.organizationId = undefined;
    }

    const exist = await this.userRepository.findUserById(id);

    if (!exist) throw new NotFoundException('User not found.');

    const user = await this.userRepository.updateUserAdmin(dto);

    if (!user) throw new NotFoundException('User not found.');

    user.profileImage = this.uploadService.createUserProfileLink(
      user.profileImage,
    );
    user.coverImage = this.uploadService.createUserCoverLink(user.coverImage);

    return user;
  }

  async listUsers(dto: AdminListUsersDto) {
    const u = await this.userRepository.listUsersAdmin(dto);
    u.users = u.users.map((us) => {
      us.profileImage = this.uploadService.createUserProfileLink(
        us.profileImage,
      );
      return us;
    });

    return u;
  }
}
