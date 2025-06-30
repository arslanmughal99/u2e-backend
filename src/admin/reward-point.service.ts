import { Injectable } from '@nestjs/common';

import {
  AdminUpdateRewardPointRuleDto,
  AdminSetRewardPointsExchangeRateDto,
} from './dto/reward-point.dto';
import { RewardPointsRepository } from '../repository/reward-points.repository';

@Injectable()
export class AdminRewardPointService {
  constructor(private rewardPointsRepository: RewardPointsRepository) {}

  async listRewardPointsRules() {
    const exchangeRate = await this.rewardPointsRepository.getExchangeRate();
    const rules = await this.rewardPointsRepository.listRewardRulesAdmin();

    return { exchangeRate, rules };
  }

  async updateRewardRule(dto: AdminUpdateRewardPointRuleDto) {
    const rule = await this.rewardPointsRepository.updateRewardRuleAdmin(dto);

    return rule;
  }

  async setExchangeRate(dto: AdminSetRewardPointsExchangeRateDto) {
    const { points } = dto;
    const rate = await this.rewardPointsRepository.setExchangeRate(points);

    return rate;
  }
}
