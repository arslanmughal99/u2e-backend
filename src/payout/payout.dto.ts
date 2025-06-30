import {
  Max,
  Min,
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { User } from '@prisma/client';

export class CreatePayoutAccountDto {
  @IsString({ message: 'Invalid IBAN .' })
  @IsNotEmpty({ message: 'IBAN is required.' })
  iban: string;

  @IsString({ message: 'Invalid bank name .' })
  @IsNotEmpty({ message: 'Bank name is required.' })
  bankName: string;

  @IsString({ message: 'Invalid currency .' })
  @IsNotEmpty({ message: 'Currency is required.' })
  currency: string;

  @IsString({ message: 'Invalid swift code .' })
  @IsNotEmpty({ message: 'Swift Code is required.' })
  swiftCode: string;

  @IsString({ message: 'Invalid branch code .' })
  @IsNotEmpty({ message: 'Branch Code is required.' })
  branchCode: string;

  @IsString({ message: 'Invalid account number .' })
  @IsNotEmpty({ message: 'Account number is required.' })
  accountNumber: string;

  @IsString({ message: 'Invalid account holder name .' })
  @IsNotEmpty({ message: 'Account holder name is required.' })
  accountHolderName: string;

  instructor: User;
}

export class UpdatePayoutAccountDto {
  @IsNotEmpty({ message: 'Payout account id is required' })
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString({ message: 'Invalid IBAN .' })
  iban?: string;

  @IsOptional()
  @IsString({ message: 'Invalid bank name .' })
  bankName?: string;

  @IsOptional()
  @IsString({ message: 'Invalid currency .' })
  currency?: string;

  @IsOptional()
  @IsString({ message: 'Invalid swift code .' })
  swiftCode?: string;

  @IsOptional()
  @IsString({ message: 'Invalid branch code .' })
  branchCode?: string;

  @IsOptional()
  @IsString({ message: 'Invalid account number .' })
  accountNumber?: string;

  @IsOptional()
  @IsString({ message: 'Invalid account holder name .' })
  accountHolderName?: string;

  instructor: User;
}

export class ListPayoutDto {
  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  page: number;

  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  size: number;
}
