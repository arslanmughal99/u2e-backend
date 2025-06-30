import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { RegisterStudentDto } from './user.dto';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

import { UserRepository } from '../repository/user.repository';
import { RewardPointsService } from '../reward-points/reward-points.service';
import { RewardPointsConditionKey } from '../repository/reward-points.repository';

@Injectable()
export class RegisterService {
  constructor(
    private userRepository: UserRepository,
    private rewardPointsService: RewardPointsService,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async registerStudent(dto: RegisterStudentDto) {
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

    const user = await this.userRepository.createStudent(dto);

    await this.rewardPointsService.giveRewardPoints(
      user,
      RewardPointsConditionKey.Registeration,
    );

    return { username: user.username };
  }
}
