import { User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { FindInstructorDto, UpdateUserDto } from './user.dto';
import { UserRepository } from '../repository/user.repository';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

@Injectable()
export class UserService {
  private exceptionMsg: string;
  constructor(
    private configs: ConfigService,
    private userRepository: UserRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
  }

  /**
   * @description Get user info
   */
  async getUserInfo(user: User) {
    // Striping confidential and internaly used data
    delete user.createdAt;
    delete user.updatedAt;

    if (user.profileImage)
      user.profileImage = this.uploadService.createUserProfileLink(
        user.profileImage,
      );

    if (user.coverImage)
      user.coverImage = this.uploadService.createUserCoverLink(user.coverImage);

    return user;
  }

  /**
   * @description Update user information
   */
  async updateUser(dto: UpdateUserDto, _user: User): Promise<User> {
    if (dto.profileImage) {
      const profileImgExist =
        await this.uploadService.verifyUserProfileImageUpload(dto.profileImage);
      if (!profileImgExist)
        throw new NotFoundException('Profile image not found.');
    }
    if (dto.coverImage) {
      const coverImgExist = await this.uploadService.verifyUserCoverImageUpload(
        dto.coverImage,
      );
      if (!coverImgExist) throw new NotFoundException('Cover image not found.');
    }

    const user = await this.userRepository.updateUser(dto, _user);

    user.profileImage = this.uploadService.createUserProfileLink(
      user.profileImage,
    );
    user.coverImage = this.uploadService.createUserCoverLink(user.coverImage);

    // Striping confidential and internaly used data
    delete user.hash;
    delete user.salt;
    delete user.createdAt;
    delete user.updatedAt;
    return user;
  }

  async findInstructor(dto: FindInstructorDto) {
    const i = await this.userRepository.findInstructor(dto);
    i.instructors = i.instructors.map((i) => {
      i.profileImage = this.uploadService.createUserProfileLink(i.profileImage);
      return i;
    });

    return i;
  }
}
