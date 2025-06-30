import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import {
  GetStatementsAnalyticsDto,
  ListInstructorStatementsDto,
  ListUserStatementsDto,
} from './statement.dto';
import { StatementRepository } from '../repository/statement.repository';

@Injectable()
export class StatementService {
  constructor(private statementRepository: StatementRepository) {}

  async listInstructorStatements(dto: ListInstructorStatementsDto) {
    const statements = await this.statementRepository.listInstructorStatements(
      dto,
    );
    return statements;
  }

  async listUserStatements(dto: ListUserStatementsDto) {
    const statements = await this.statementRepository.listUserStatements(dto);
    return statements;
  }

  async getAnalytics(dto: GetStatementsAnalyticsDto, instructor: User) {
    const analytics = await this.statementRepository.getAnalytics(
      dto,
      instructor,
    );

    return analytics;
  }
}
