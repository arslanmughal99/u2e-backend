import {
  Max,
  Min,
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { User } from '@prisma/client';

export class RegisterNotificationDto {
  @IsString({ message: 'Invalid notification register token.' })
  @IsNotEmpty({ message: 'Notification register token is required.' })
  token: string;

  user: User;
}

export class InstructorCourseNotificationDto {
  @IsString({ message: 'Invalid title.' })
  @IsNotEmpty({ message: 'Title is required.' })
  title: string;

  @IsString({ message: 'Invalid message.' })
  @IsNotEmpty({ message: 'Message is required.' })
  message: string;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid course id.' },
  )
  @IsNotEmpty({ message: 'Course id is required.' })
  courseId: number;

  instructor: User;
}

export class InstructorListSendNotificationsDto {
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
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid course id.' },
  )
  courseId?: number;

  instructor: User;
}

export class UserListNotificationsDto {
  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  page: number;

  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  size: number;

  // @IsOptional()
  // @IsNumber(
  //   { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
  //   { message: 'Invalid course id.' },
  // )
  // courseId?: number;

  user: User;
}
