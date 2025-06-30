import {
  Min,
  Max,
  IsEnum,
  IsArray,
  IsNumber,
  IsString,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { AssignmentStatus, User } from '@prisma/client';

import { AttachmentsDto } from '../upload/upload.dto';

export class ReplyAssignmentDto {
  @Min(1, { message: 'Invalid assignment id .' })
  @IsNotEmpty({ message: 'Assignment id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid assignment id.' },
  )
  assignmentId: number;

  @IsString({ message: 'Invalid message.' })
  @IsNotEmpty({ message: 'Assignment message is required.' })
  message: string;

  // @IsOptional()
  // @IsArray({ message: 'Attachment need to be as array.' })
  // @IsString({ message: 'Invalid attachment(s)', each: true })
  // attachments?: string[];
  @IsOptional()
  @IsArray({ message: 'Attachments need to be an array.' })
  @ValidateNested({ message: 'Invalid attachment format.' })
  attachments?: AttachmentsDto[];

  user: User;
  // status: AssignmentStatus;
}

export class ListUserAssignmentDto {
  @IsOptional()
  @Min(1, { message: 'Invalid course id .' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course id.' },
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
  @IsEnum(AssignmentStatus, { message: 'Invalid status.' })
  status?: AssignmentStatus;

  @IsOptional()
  @IsString({ message: 'Invalid search value.' })
  @MaxLength(200, { message: 'Max 200 characters for search.' })
  search?: string;

  user: User;
}

export class ListInstructorActiveAssignmentDto {
  @Min(1, { message: 'Invalid course id .' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course id.' },
  )
  courseId?: number;

  @IsOptional()
  @IsEnum(AssignmentStatus, { message: 'Invalid assignment status.' })
  status?: AssignmentStatus;

  @IsOptional()
  @IsString({ message: 'Invalid username' })
  username?: string;

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
  @IsString({ message: 'Invalid search value.' })
  @MaxLength(200, { message: 'Max 200 characters for search.' })
  search?: string;

  user: User;
}

export class GetUserActiveAssignmentById {
  @Min(1, { message: 'Invalid assignment id .' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid assignment id.' },
  )
  id: number;

  ip: string;
  user: User;
}

export class GetInstructorActiveAssignmentById {
  @Min(1, { message: 'Invalid assignment id .' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid assignment id.' },
  )
  id: number;

  ip: string;
  user: User;
}

export class ListAssignmentCommentsDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid assignmentId' },
  )
  assignmentId: number;

  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  page: number;

  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  size: number;

  ip: string;
  user: User;
}

export class UpdateActiveAssignmentDto {
  @Min(1, { message: 'Invalid assignment id .' })
  @IsNotEmpty({ message: 'Assignment id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid assignment id.' },
  )
  assignmentId: number;

  @Min(0, { message: 'Marks cannot be negative' })
  @IsNotEmpty({ message: 'Min marks are required.' })
  @IsNumber(
    { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
    { message: 'Invalid min marks provided.' },
  )
  marksObtained: number;

  user: User;
}
