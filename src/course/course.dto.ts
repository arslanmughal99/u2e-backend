import {
  Max,
  Min,
  IsEnum,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { BillingType, Category, EnrollmentStatus, User } from '@prisma/client';
import { Type } from 'class-transformer';

export enum CourseType {
  All = 'All',
  Instructor = 'Instructor',
  Organization = 'Organization',
}

class CourseRequirementsDto {
  @IsBoolean({ message: 'Invalid required value.' })
  @IsNotEmpty({ message: 'Required cannot be empty.' })
  required: boolean;

  @IsString({ message: 'Invalid requirements.' })
  @IsNotEmpty({ message: 'Requirement cannot be empty' })
  requirement: string;
}

class CourseFaqsDto {
  @IsString({ message: 'Invalid title.' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  title: string;

  @IsString({ message: 'Invalid answer.' })
  @IsNotEmpty({ message: 'Answer cannot be empty' })
  answer: string;
}

export class CreateCourseDto {
  @IsString({ message: 'Invalid course title.' })
  @IsNotEmpty({ message: 'Course title is required.' })
  @MaxLength(100, { message: ' Course title should be max 100 characters.' })
  @MinLength(10, {
    message: 'Course title must be atleast 10 characters long.',
  })
  title: string;

  @IsString({ message: 'Invalid course description.' })
  @IsNotEmpty({ message: 'Course description is required.' })
  @MinLength(100, {
    message: 'Course description must be minimum 100 characters.',
  })
  description: string;

  @IsString({ message: 'Invalid course thumbnail.' })
  @IsNotEmpty({ message: 'Course thumbnail is required.' })
  thumbnail: string;

  @IsNotEmpty({ message: 'Course category is required.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid category .' })
  categoryId: number;

  @Min(1, { message: 'Course price must be minimum 1.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 1 },
    { message: 'Invalid course price.' },
  )
  @IsNotEmpty({ message: 'Course price is required.' })
  price: number;

  @IsNotEmpty({ message: 'billingType is required.' })
  @IsEnum(BillingType, { message: 'Invalid billing type selected.' })
  billingType: BillingType;

  @IsOptional()
  @IsBoolean({ message: 'Invalid value for organization.' })
  forOrganization?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseRequirementsDto)
  @IsArray({ message: 'Requirements need to be an array.' })
  requirements?: CourseRequirementsDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseFaqsDto)
  @IsArray({ message: 'FAQs need to be an array.' })
  faqs?: CourseFaqsDto[];

  instructor: User;
  _category: Category;
}

export class UpdateCourseDto {
  @IsNotEmpty({ message: 'course id required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course id.' },
  )
  id: number;

  @IsOptional()
  @IsString({ message: 'Invalid course title.' })
  @MaxLength(100, { message: ' Course title should be max 100 characters.' })
  @MinLength(10, {
    message: 'Course title must be atleast 10 characters long.',
  })
  title?: string;

  @Min(1, { message: 'Course price must be minimum 1.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 1 },
    { message: 'Invalid course price.' },
  )
  @IsOptional()
  price?: number;

  @IsOptional()
  @IsEnum(BillingType, { message: 'Invalid billing type selected.' })
  billingType?: BillingType;

  @IsNotEmpty({ message: 'Course category is required.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid category .' })
  categoryId: number;

  @IsOptional()
  @IsString({ message: 'Invalid course description.' })
  @MinLength(100, {
    message: 'Course description must be minimum 100 characters.',
  })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Invalid course thumbnail.' })
  thumbnail?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseRequirementsDto)
  @IsArray({ message: 'Attachments need to be an array.' })
  requirements?: CourseRequirementsDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CourseFaqsDto)
  @IsArray({ message: 'FAQs need to be an array.' })
  faqs?: CourseFaqsDto[];

  // @IsOptional()
  // @IsBoolean({ message: 'Invalid published value.' })
  // published?: boolean;

  instructor: User;
  _category: Category;
}

export class PublishCourseDto {
  @IsNotEmpty({ message: 'course id required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course id.' },
  )
  id: number;

  @IsOptional()
  @IsBoolean({ message: 'Invalid published value.' })
  published?: boolean;

  instructor: User;
}

export class ListInstructorCoursesDto {
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
  @IsEnum(CourseType, { message: 'Invalid course type value.' })
  courseType?: CourseType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid category .' })
  categoryId?: number;
}

export class ListPublicCoursesDto {
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
  @IsEnum(CourseType, { message: 'Invalid course type value.' })
  courseType?: CourseType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid category .' })
  categoryId?: number;
}

export class ListEnrolledCoursesDto {
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
  @IsEnum(EnrollmentStatus, { message: 'Invalid status' })
  status?: EnrollmentStatus;

  @IsOptional()
  @IsString({ message: 'Invalid search value.' })
  @MaxLength(200, { message: 'Max 200 characters for search.' })
  search?: string;

  @IsOptional()
  @IsEnum(CourseType, { message: 'Invalid course type value.' })
  courseType?: CourseType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid category .' })
  categoryId?: number;
}

export class GetCourseByIdDto {
  @IsNotEmpty({ message: 'Course id is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid Course id.' },
  )
  id: number;
}

export class GetEnrolledCourseByIdDto {
  @IsNotEmpty({ message: 'Course id is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid Course id.' },
  )
  id: number;

  student: User;
}

export class CreateCourseReviewDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowNaN: false, allowInfinity: false },
    { message: 'Invalid course id.' },
  )
  @IsNotEmpty({ message: 'Course id is required.' })
  courseId: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid rating provided.' },
  )
  @IsNotEmpty({ message: 'Rating is required.' })
  @Min(1, { message: 'Rating is required.' })
  @Max(5, { message: 'Rating is required.' })
  rating: number;

  @IsNotEmpty({ message: 'Review is required.' })
  @IsString({ message: 'Review must be plan text.' })
  review: string;

  user: User;
  id?: number;
}

export class ListCourseReviewsDto {
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  page: number;

  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  size: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid rating provided.' },
  )
  @IsOptional()
  @Min(1, { message: 'Rating is required.' })
  @Max(5, { message: 'Rating is required.' })
  rating?: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowNaN: false, allowInfinity: false },
    { message: 'Invalid course id.' },
  )
  @IsNotEmpty({ message: 'Course id is required.' })
  courseId: number;
}

export class GetCourseProgressDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid course id.' },
  )
  @IsNotEmpty({ message: 'Course id is required.' })
  courseId: number;

  user: User;
}
