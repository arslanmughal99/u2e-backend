import {
  Logger,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Etcd3 } from 'etcd3';
import { ConfigService } from '@nestjs/config';
import { RewardPointsType, User } from '@prisma/client';

import { EtcdService } from './etcd.service';
import { PrismaService } from './prisma.service';
import { ListRewardPointsDto } from '../reward-points/reward-points.dto';
import { AdminUpdateRewardPointRuleDto } from '../admin/dto/reward-point.dto';

export type RewardPointCondition = {
  title: string;
  points: number;
  active: boolean;
  id: RewardPointsConditionKey;
};

const REWARD_POINT_EXCHANGE = 'rewardexchnage/';
const REWARDPOINTS_NAMESPACE = 'rewardpoints/';

export enum RewardPointsConditionKey {
  NewBadge = 'new-badge',
  CreateThread = 'create-thread',
  PostReplyThread = 'reply-in-forum',
  AssignmentPass = 'assignment-passed',
  Registeration = 'user-registeration',
  PublishingCourse = 'course-published',
  CourseCompletion = 'course-completion',
  CourseReviewRate = 'course-review-rate',
  AchievingCertificate = 'achive-certificate',
  PurchaseStoreProducts = 'purchase-store-product',
  // MeetingReservationStudent = 'meeting-reservation-student',
  // MeetingReservationInstructor = 'meeting-reservation-instructor',
}

const defaultConditions: RewardPointCondition[] = [
  {
    points: 0,
    active: false,
    title: 'Posting a Reply in Forum',
    id: RewardPointsConditionKey.PostReplyThread,
  },
  {
    points: 0,
    active: false,
    title: 'Create a Forum Topic',
    id: RewardPointsConditionKey.CreateThread,
  },
  {
    points: 0,
    active: false,
    title: 'Assignment Pass',
    id: RewardPointsConditionKey.AssignmentPass,
  },
  {
    points: 0,
    active: false,
    title: 'Purchase Store Products',
    id: RewardPointsConditionKey.PurchaseStoreProducts,
  },
  {
    points: 0,
    active: false,
    title: 'Course Completion',
    id: RewardPointsConditionKey.CourseCompletion,
  },
  // {
  //   points: 0,
  //   active: false,
  //   title: 'Meeting Reservation (Student)',
  //   id: RewardPointsConditionKey.MeetingReservationStudent,
  // },
  // {
  //   points: 0,
  //   active: false,
  //   title: 'Meeting Reservation (Instructor)',
  //   id: RewardPointsConditionKey.MeetingReservationInstructor,
  // },
  {
    points: 0,
    active: false,
    title: 'Course Review (Rate)',
    id: RewardPointsConditionKey.CourseReviewRate,
  },
  {
    points: 0,
    active: false,
    title: 'Registration',
    id: RewardPointsConditionKey.Registeration,
  },
  {
    points: 0,
    active: false,
    title: 'Achieving a Certificate',
    id: RewardPointsConditionKey.AchievingCertificate,
  },
  {
    points: 0,
    active: false,
    title: 'Publishing a Course',
    id: RewardPointsConditionKey.PublishingCourse,
  },
  {
    points: 0,
    active: false,
    title: 'New Badge',
    id: RewardPointsConditionKey.NewBadge,
  },
];

@Injectable()
export class RewardPointsRepository {
  private etcd: Etcd3;
  private exceptionMsg: string;
  private logger = new Logger('RewardPointsRepository');
  constructor(
    private prisma: PrismaService,
    private configs: ConfigService,
    private etcdService: EtcdService,
  ) {
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
    this.etcd = this.etcdService.instance;
    this.setDefaultOptions();
  }

  async getCondition(
    id: RewardPointsConditionKey,
  ): Promise<RewardPointCondition | undefined> {
    try {
      const condition = await this.etcd
        .namespace(REWARDPOINTS_NAMESPACE)
        .get(id);

      if (condition) return JSON.parse(condition);

      return undefined;
    } catch (err) {
      this.logger.error('failed to get condition', err);
      this.logger.debug({ conditionId: id });
      return undefined;
    }
  }

  async setCondition(
    id: RewardPointsConditionKey,
    value: RewardPointCondition,
  ) {
    await this.etcd
      .namespace(REWARDPOINTS_NAMESPACE)
      .put(id)
      .value(JSON.stringify(value))
      .exec();
  }

  private async setDefaultOptions() {
    const setCondtions = defaultConditions
      .map((c) => {
        return async () => {
          const exist = await this.etcd
            .namespace(REWARDPOINTS_NAMESPACE)
            .get(c.id)
            .exists();
          if (exist) {
            return;
          }

          await this.setCondition(c.id, c);
        };
      })
      .map((f) => f());
    await Promise.all(setCondtions);
  }

  async createRewardPoints(args: {
    user: Partial<User>;
    reason: string;
    points: number;
    type: RewardPointsType;
  }) {
    const { user, type, reason, points } = args;
    try {
      const _rewardPoints = await this.prisma.rewardPoints.create({
        data: {
          type,
          reason,
          points,
          userId: user.id,
        },
      });
      return _rewardPoints;
    } catch (err) {
      this.logger.error('failed to create reward points', err);
      this.logger.debug({ userId: user.id, type, reason, points });
    }
  }

  async listRewardPoints(dto: ListRewardPointsDto) {
    const { page, size, user } = dto;

    try {
      const {
        _sum: { points: earned },
      } = await this.prisma.rewardPoints.aggregate({
        where: { userId: user.id, type: RewardPointsType.Earn },
        _sum: { points: true },
      });
      const {
        _sum: { points: spent },
      } = await this.prisma.rewardPoints.aggregate({
        where: { userId: user.id, type: RewardPointsType.Spent },
        _sum: { points: true },
      });
      const available = earned - spent;

      const [total, rewards] = await this.prisma.$transaction([
        this.prisma.rewardPoints.count({ where: { userId: user.id } }),
        this.prisma.rewardPoints.findMany({
          take: size,
          skip: (page - 1) * size,
          orderBy: { id: 'desc' },
          where: { userId: user.id },
          select: { points: true, reason: true, type: true, createdAt: true },
        }),
      ]);
      return {
        statics: { earned: earned ?? 0, spent: spent ?? 0, available },
        total,
        rewards,
      };
    } catch (err) {
      this.logger.error('failed to list reward points.', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async listRewardRulesAdmin() {
    try {
      const rulesResp = await this.etcd
        .namespace(REWARDPOINTS_NAMESPACE)
        .getAll();

      const rules = Object.values(rulesResp).map((v) => JSON.parse(v));

      return rules;
    } catch (err) {
      this.logger.error('failed to list reward points rules', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async updateRewardRuleAdmin(dto: AdminUpdateRewardPointRuleDto) {
    const { id, active, points } = dto;

    try {
      const oldRule = await this.getCondition(id as any);

      if (!oldRule) throw new NotFoundException('Rule not found.');

      const rule: RewardPointCondition = {
        id: id as any,
        title: oldRule.title,
        active: active ?? oldRule.active,
        points: points ?? oldRule.points,
      };

      await this.setCondition(id as any, rule);
      return rule;
    } catch (err) {
      this.logger.error('failed to update reward rule', err);
      this.logger.debug(dto);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async setExchangeRate(points: number) {
    try {
      await this.etcd
        .namespace(REWARD_POINT_EXCHANGE)
        .put('exchange-rate')
        .value(JSON.stringify(points))
        .exec();

      return points;
    } catch (err) {
      this.logger.error('failed to set reward points exchange rate', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  async getExchangeRate() {
    try {
      const rate = await this.etcd
        .namespace(REWARD_POINT_EXCHANGE)
        .get('exchange-rate');

      if (rate) return parseInt(rate);

      this.logger.warn(
        'failed to parse exchange rate, falling back to default',
      );
      return 1;
    } catch (err) {}
  }
}
