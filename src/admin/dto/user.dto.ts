import {
  Max,
  Min,
  IsIn,
  IsEmail,
  IsNumber,
  IsString,
  MaxLength,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsTimeZone,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class AdminGetUserInfoDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid user id.' },
  )
  @Min(1, { message: 'Invalid user id .' })
  @IsNotEmpty({ message: 'User id is required.' })
  id: number;
  // @IsString({ message: 'Invalid username.' })
  // @IsNotEmpty({ message: 'Username is required.' })
  // username: string;
}

export class AdminResetUserPasswordDto {
  @IsString({ message: 'Invalid username.' })
  @IsNotEmpty({ message: 'Username is required.' })
  username: string;

  @IsString({ message: 'Invalid password.' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class AdminUpdateUserDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid user id.' },
  )
  @Min(1, { message: 'Invalid user id .' })
  @IsNotEmpty({ message: 'User id is required.' })
  id: number;

  @IsString({ message: 'Invalid firstname.' })
  @MaxLength(200, { message: 'First Name too long.' })
  @IsNotEmpty({ message: 'First name is required.' })
  firstName: string;

  @IsString({ message: 'Invalid lastname.' })
  @MaxLength(200, { message: 'Last Name too long.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName: string;

  @IsOptional()
  @IsEmail(undefined, { message: 'Invalid email address.' })
  email?: string;

  @IsOptional()
  @IsTimeZone({ message: 'Invalid timezone.' })
  timezone?: string;

  @IsOptional()
  @IsString({ message: 'Invalid job title.' })
  @MaxLength(50, {
    message: 'Job title cannot be more than 50 characters long.',
  })
  jobTitle?: string;

  @IsOptional()
  @IsBoolean({ message: 'Invalid identified value.' })
  identified?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Invalid verified value.' })
  verified?: boolean;

  @IsOptional()
  organizationId?: any;

  @IsOptional()
  @IsIn([UserRole.Instructor, UserRole.Organization, UserRole.Student], {
    message: 'Invalid role.',
  })
  role?: UserRole;

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid payout lock time .' },
  )
  @Min(1, { message: 'Invalid payout lock time .' })
  payoutLockTime?: number;
}

export class AdminListUsersDto {
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
  @IsBoolean({ message: 'Invalid verified value.' })
  verified?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Invalid identified value.' })
  identified?: boolean;

  @IsOptional()
  @IsIn(
    [
      UserRole.Admin,
      UserRole.Instructor,
      UserRole.Organization,
      UserRole.Student,
    ],
    { message: 'Invalid role.' },
  )
  role?: UserRole;

  @IsOptional()
  @IsString({ message: 'Invalid username.' })
  username?: string;

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid organization id' },
  )
  organizationId?: number;
}
