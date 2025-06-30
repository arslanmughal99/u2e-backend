import {
  Min,
  IsEnum,
  IsNumber,
  IsString,
  IsNotEmpty,
  ArrayMinSize,
  IsOptional,
  Max,
  MaxLength,
} from 'class-validator';
import { BillingType } from '@prisma/client';

export class CreateBundleDto {
  @IsString({ message: 'Invalid bundle title.' })
  @IsNotEmpty({ message: 'Bundle title is required.' })
  title: string;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid price' },
  )
  @Min(0, { message: 'Minimum price should be 0.' })
  @IsNotEmpty({ message: 'Bundle price is require.' })
  price: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { each: true, message: 'Invalid course id(s) provided.' },
  )
  @IsNotEmpty({ message: 'Course ids are required.' })
  @ArrayMinSize(2, { message: 'Select minimum 2 courses.' })
  courseIds: number[];

  @IsNotEmpty({ message: 'billingType is required.' })
  @IsEnum(BillingType, { message: 'Invalid billing type selected.' })
  billingType: BillingType;
}

export class UpdateBundleDto {
  @Min(0, { message: 'Invalid bundle id .' })
  @IsNotEmpty({ message: 'Bundle id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid bundle id.' },
  )
  id: number;

  @IsString({ message: 'Invalid bundle title.' })
  @IsOptional()
  title?: string;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid price' },
  )
  @Min(0, { message: 'Minimum price should be 0.' })
  @IsOptional()
  price?: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { each: true, message: 'Invalid course id(s) provided.' },
  )
  @ArrayMinSize(2, { message: 'Select minimum 2 courses.' })
  @IsOptional()
  courseIds?: number[];

  @IsEnum(BillingType, { message: 'Invalid billing type selected.' })
  @IsOptional()
  billingType?: BillingType;
}

export class DeleteBundleDto {
  @Min(0, { message: 'Invalid bundle id .' })
  @IsNotEmpty({ message: 'Bundle id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid bundle id.' },
  )
  id: number;
}

export class ListBundlesDto {
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  page: number;

  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  size: number;

  @IsOptional()
  @IsString({ message: 'Invalid search value.' })
  @MaxLength(200, { message: 'Max 200 characters for search.' })
  search?: string;

  @IsOptional()
  @IsEnum(BillingType, { message: 'Invalid billing type value.' })
  billingType?: BillingType;
}

export class GetBundleByIdDto {
  @Min(1, { message: 'Invalid bundle id.' })
  @IsNotEmpty({ message: 'id is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid bundle id.' },
  )
  id: number;
}

export class ListInstructorBundlesDto {
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  page: number;

  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  size: number;

  @IsOptional()
  @IsString({ message: 'Invalid search value.' })
  @MaxLength(200, { message: 'Max 200 characters for search.' })
  search?: string;

  @IsOptional()
  @IsEnum(BillingType, { message: 'Invalid billing type value.' })
  billingType?: BillingType;
}
