import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PayoutStatus, User } from '@prisma/client';

import {
  ListPayoutDto,
  CreatePayoutAccountDto,
  UpdatePayoutAccountDto,
} from './payout.dto';
import { PayoutRepository } from '../repository/payout.repository';
import { StatementRepository } from '../repository/statement.repository';

@Injectable()
export class PayoutService {
  constructor(
    private payoutRepository: PayoutRepository,
    private statementService: StatementRepository,
  ) {}

  async createPayoutAccount(
    dto: CreatePayoutAccountDto | UpdatePayoutAccountDto,
  ) {
    const { instructor } = dto;
    const hasAccount = await this.payoutRepository.getPayoutAccount(instructor);
    // if (hasAccount)
    // throw new ConflictException('Payout account already exist.');

    let account: any;

    if (hasAccount) {
      (dto as UpdatePayoutAccountDto).id = hasAccount.id;
      account = await this.payoutRepository.updatePayoutAccount(
        dto as UpdatePayoutAccountDto,
      );
    } else {
      account = await this.payoutRepository.createPayoutAccount(
        dto as CreatePayoutAccountDto,
      );
    }

    delete account.id;
    delete account.userId;
    delete account.createdAt;

    return account;
  }

  async createPayout(instructor: User) {
    const pendingPayout = await this.payoutRepository.getLastPayout(
      PayoutStatus.Pending,
      instructor,
    );

    if (pendingPayout)
      throw new ConflictException(
        'Payout is already pending, Please wait for that to complete first.',
      );

    const lastPayout = await this.payoutRepository.getLastPayout(
      PayoutStatus.Paid,
      instructor,
    );
    let lastStatementId = 0;
    // check if last payout time is not in payout lock time
    if (lastPayout) {
      lastStatementId = lastPayout.lastStatementId;

      const diff = lastPayout.createdAt.getTime() - Date.now();
      const leftDays = Math.ceil(diff / (1000 * 3600 * 24));

      if (leftDays < instructor.payoutLockTime) {
        throw new UnauthorizedException(
          `Please wait for ${instructor.payoutLockTime - leftDays} days.`,
        );
      }
    }

    const { amount, lastStatement } =
      await this.statementService.getCalculatedPayoutWithLastStatement(
        lastStatementId,
        instructor,
      );

    if (!lastStatement || amount <= 0)
      throw new NotFoundException('Not enough funds .');

    const payoutAccount = await this.payoutRepository.getPayoutAccount(
      instructor,
    );

    if (!payoutAccount)
      throw new NotFoundException('Payout account not found.');

    const payout = await this.payoutRepository.createPayout(
      {
        amount,
        lastStatement,
        payoutAccount,
      },
      instructor,
    );

    return {
      id: payout.id,
      amount: payout.amount,
      status: payout.status,
      currency: payout.currency,
    };
  }

  async getPayoutAccount(instructor: User) {
    const account = await this.payoutRepository.getPayoutAccount(instructor);

    delete account.id;
    delete account.userId;
    delete account.createdAt;

    return account;
  }

  async listPayouts(dto: ListPayoutDto, instructor: User) {
    const payouts = await this.payoutRepository.listPayouts(dto, instructor);
    return payouts;
  }
}
