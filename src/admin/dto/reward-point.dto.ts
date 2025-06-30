import {
  IsEnum,
  IsNumber,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

import { RewardPointsConditionKey } from '../../repository/reward-points.repository';

export class AdminUpdateRewardPointRuleDto {
  @IsEnum(RewardPointsConditionKey, { message: 'Invalid id' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: string;

  // @IsString({ message: 'Invalid title' })
  // @IsNotEmpty({ message: 'Title is required.' })
  // title: string;

  // @IsNotEmpty({ message: 'Point(s) are required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid points' },
  )
  @IsOptional()
  points?: number;

  // @IsNotEmpty({ message: 'Active value is required.' })
  @IsOptional()
  @IsBoolean({ message: 'Invalid active value.' })
  active?: boolean;
}

export class AdminSetRewardPointsExchangeRateDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid points .' },
  )
  @IsNotEmpty({ message: 'Points are required.' })
  points: number;
}
