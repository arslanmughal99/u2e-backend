import {
  Max,
  Min,
  IsIn,
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { PayoutStatus } from '@prisma/client';

export class AdminListPayoutDto {
  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  page: number;

  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  size: number;

  @IsOptional()
  @IsIn([PayoutStatus.Paid, PayoutStatus.Pending, PayoutStatus.Rejected], {
    message: 'Invalid status',
  })
  status?: PayoutStatus;

  @IsOptional()
  @IsDateString(undefined, { message: 'Invalid to date.' })
  to?: Date;

  @IsOptional()
  @IsDateString(undefined, { message: 'Invalid from date.' })
  from?: Date;
}

export class AdminUpdatePayoutDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;

  @IsNotEmpty({ message: 'Status is required.' })
  @IsIn([PayoutStatus.Paid, PayoutStatus.Pending, PayoutStatus.Rejected], {
    message: 'Invalid status',
  })
  status: PayoutStatus;

  @IsOptional()
  @IsString({ message: 'Invalid transaction id' })
  trxId?: string;
}

export class AdminGetPayoutByIdDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;
}
