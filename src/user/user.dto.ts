import {
  Max,
  Min,
  IsIn,
  IsEnum,
  IsEmail,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsTimeZone,
  IsOptional,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterStudentDto {
  @IsString({ message: 'Invalid firstname.' })
  @MaxLength(200, { message: 'First Name too long.' })
  @IsNotEmpty({ message: 'First name is required.' })
  firstName?: string;

  @IsString({ message: 'Invalid lastname.' })
  @MaxLength(200, { message: 'Last Name too long.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName?: string;

  @IsString({ message: 'Invalid passowrd.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MaxLength(500, { message: 'Password too long.' })
  @MinLength(10, { message: 'Password must be minimum 10 characters.' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'Invalid profile image.' })
  profileImage?: string;

  @IsOptional()
  @IsString({ message: 'Invalid cover image.' })
  coverImage?: string;

  @IsString({ message: 'Invalid username.' })
  @MinLength(2, { message: 'username must be minimum 2 characters.' })
  @MaxLength(20, { message: 'username must be maximum 20 characters.' })
  @IsNotEmpty({ message: 'Username is required.' })
  username?: string;

  @IsEmail(undefined, { message: 'Invalid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email?: string;

  @IsTimeZone({ message: 'Invalid timezone.' })
  @IsNotEmpty({ message: 'Time zone is required.' })
  timezone: string;
}

export class RegisterStudentFacebookDto {
  @IsString({ message: 'Invalid firstname.' })
  @MaxLength(200, { message: 'First Name too long.' })
  @IsNotEmpty({ message: 'First name is required.' })
  firstName: string;

  @IsString({ message: 'Invalid lastname.' })
  @MaxLength(200, { message: 'Last Name too long.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName: string;

  facebookid: string;

  // @IsString({ message: 'Invalid passowrd.' })
  // @IsNotEmpty({ message: 'Password is required.' })
  // @MaxLength(500, { message: 'Password too long.' })
  // @MinLength(10, { message: 'Password must be minimum 10 characters.' })
  // password: string;

  // @IsOptional()
  // @IsString({ message: 'Invalid profile image.' })
  // profileImage?: string;

  // @IsOptional()
  // @IsString({ message: 'Invalid cover image.' })
  // coverImage?: string;

  // @IsString({ message: 'Invalid username.' })
  // @MinLength(2, { message: 'username must be minimum 2 characters.' })
  // @MaxLength(20, { message: 'username must be maximum 20 characters.' })
  // @IsNotEmpty({ message: 'Username is required.' })
  // username: string;

  @IsEmail(undefined, { message: 'Invalid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  // @IsTimeZone({ message: 'Invalid timezone.' })
  // @IsNotEmpty({ message: 'Time zone is required.' })
  // timezone: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Invalid bio provided.' })
  @MaxLength(200, { message: 'Bio cannot be more than 200 characters long.' })
  bio?: string;

  @IsOptional()
  @IsEmail(undefined, { message: 'Invalid email .' })
  email?: string;

  @IsOptional()
  @IsTimeZone({ message: 'Invalid time zone.' })
  timezone?: string;

  @IsOptional()
  @IsString({ message: 'Invalid profile image.' })
  profileImage?: string;

  @IsOptional()
  @IsString({ message: 'Invalid cover image.' })
  coverImage?: string;

  @IsString({ message: 'Invalid firstname.' })
  @MaxLength(200, { message: 'First Name too long.' })
  @IsNotEmpty({ message: 'First name is required.' })
  firstName: string;

  @IsString({ message: 'Invalid lastname.' })
  @MaxLength(200, { message: 'Last Name too long.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName: string;

  @IsOptional()
  @IsString({ message: 'Invalid job title.' })
  @MaxLength(50, {
    message: 'Job title cannot be more than 50 characters long.',
  })
  jobTitle?: string;
}

export enum FindInstructorSortBy {
  None = 'None',
  TopRated = 'TopRated',
  TopSeller = 'TopSeller',
}
export class FindInstructorDto {
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
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid category .' },
  )
  categoryId?: number;

  @IsOptional()
  @IsIn([UserRole.Instructor, UserRole.Organization], {
    message: 'Invalid instructor type.',
  })
  type?: UserRole;

  @IsOptional()
  @IsEnum(FindInstructorSortBy, { message: 'Invalid sort by value.' })
  sortBy?: FindInstructorSortBy;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid max price.' },
  )
  maxPrice?: number;
}
