import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  AdminListPayoutDto,
  AdminUpdatePayoutDto,
  AdminGetPayoutByIdDto,
} from './dto/payout.dto';
import { UploadService, UPLOAD_SERVICE } from '../upload/upload.port';

import { PayoutRepository } from '../repository/payout.repository';

@Injectable()
export class AdminPayoutService {
  constructor(
    private payoutrepository: PayoutRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {}

  async listPayoutServices(dto: AdminListPayoutDto) {
    const p = await this.payoutrepository.listPayoutsAdmin(dto);
    p.payouts = p.payouts.map((_p) => {
      _p.user.profileImage = this.uploadService.createUserProfileLink(
        _p.user.profileImage,
      );
      return _p;
    });

    return p;
  }

  async getPayoutById(dto: AdminGetPayoutByIdDto) {
    const { id } = dto;
    const p = await this.payoutrepository.getPayoutByIdAdmin(id);

    if (!p) throw new NotFoundException('Payout not found.');

    p.user.profileImage = this.uploadService.createUserProfileLink(
      p.user.profileImage,
    );

    return p;
  }

  async updatePayout(dto: AdminUpdatePayoutDto) {
    const exist = await this.getPayoutById({ id: dto.id });

    if (!exist) throw new NotFoundException('Payout not found.');

    const p = await this.payoutrepository.updatePayoutAdmin(dto);
    p.user.profileImage = this.uploadService.createUserProfileLink(
      p.user.profileImage,
    );

    return p;
  }
}
