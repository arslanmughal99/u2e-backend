import {
  Max,
  Min,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { PaymentMethod, User } from '@prisma/client';

export class ListPaymentsDto {
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
  @IsDateString(undefined, { message: 'Invalid to date.' })
  to?: Date;

  @IsOptional()
  @IsDateString(undefined, { message: 'Invalid from date.' })
  from?: Date;
}

export class GetPaymentsAnalyticsDto {
  @IsOptional()
  @Max(3000, { message: 'Invalid year provided .' })
  @Min(2023, { message: 'Min year should be 2023.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid year provided.' },
  )
  year?: number;

  // @IsOptional()
  //
  // })
  // @IsNumber(
  //   { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
  //   { message: 'Invalid course.' },
  // )
  // courseId?: number;
}

export class PayOrderDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsNotEmpty({ message: 'order id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid order id.' },
  )
  orderId: number;

  user: User;
}
