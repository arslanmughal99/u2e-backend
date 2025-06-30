import {
  Max,
  Min,
  IsString,
  MaxLength,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
} from 'class-validator';
import { EnrollmentStatus, User } from '@prisma/client';

export class ListEnrollmentsDto {
  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course.' },
  )
  courseId?: number;

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

export class GetEnrollmentAnalyticsDto {
  @IsOptional()
  @Max(3000, { message: 'Invalid year provided .' })
  @Min(2023, { message: 'Min year should be 2023.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid year provided.' },
  )
  year?: number;

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course.' },
  )
  courseId?: number;
}

export class UpdateEnrollmentStatusDto {
  @IsNotEmpty({ message: 'Enrollment id is required' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid enrollment.' },
  )
  id: number;

  @IsNotEmpty({ message: 'Enrollment status is required.' })
  @IsEnum(EnrollmentStatus, { message: 'Invalid enrollment update status.' })
  status: EnrollmentStatus;

  student: User;
}

export class EnrollFreeInstantDto {
  @IsNotEmpty({ message: 'Course are required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid course id.', each: true },
  )
  @IsArray({ message: 'Invalid format' })
  courseIds: number[];

  student: User;
}

// export class EnrollDto {
//   @IsOptional()
//   @IsString({ message: 'Invalid payment token.' })
//   @MaxLength(150, { message: 'Invalid payment token provided.' })
//   token?: string;
// }
