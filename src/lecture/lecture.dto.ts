import {
  Min,
  Max,
  IsArray,
  IsNumber,
  IsString,
  MaxLength,
  IsBoolean,
  MinLength,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { User } from '@prisma/client';
import { Type } from 'class-transformer';
import { AttachmentsDto } from '../upload/upload.dto';

export class CreateAssignmentDto {
  @Min(1, { message: 'Invalid deadline.' })
  @IsNotEmpty({ message: 'Assignment deadline is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid deadline.' },
  )
  deadline: number;

  @Min(1, { message: 'Invalid assignment min mark.' })
  @IsNotEmpty({ message: 'Assignment min marks required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid assignment min marks .' },
  )
  minMarks: number;

  @Min(100, { message: 'Invalid assignment max mark.' })
  @IsNotEmpty({ message: 'Assignment max marks required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid assignment max marks .' },
  )
  maxMarks: number;

  @IsString({ message: 'Invalid assignment title .' })
  @IsNotEmpty({ message: 'Assignment title is required.' })
  title: string;

  // @IsOptional()
  // @IsArray({ message: 'Attachments need to be a list.' })
  // @IsString({ message: 'Invalid attachment', each: true })
  // attachments?: string[];
  @IsOptional()
  @IsArray({ message: 'Attachments need to be an array.' })
  @ValidateNested({ message: 'Invalid attachment format.' })
  attachments?: AttachmentsDto[];
}

export class QuizQuestion {
  @IsString({ message: 'Invalid quiz answer.' })
  @IsNotEmpty({ message: 'Quiz answer is required.' })
  answer: string;

  @IsString({ message: 'Invalid quiz question.' })
  @IsNotEmpty({ message: 'Quiz question is required.' })
  question: string;

  @IsString({ message: 'Invalid quiz option(s).', each: true })
  @IsNotEmpty({ message: 'Quiz option(s) are required.' })
  options: string[];
}

export class UpdateQuizQuestion {
  @IsString({ message: 'Invalid quiz answer.' })
  @IsNotEmpty({ message: 'Quiz answer is required.' })
  answer: string;

  @IsString({ message: 'Invalid quiz question.' })
  @IsNotEmpty({ message: 'Quiz question is required.' })
  question: string;

  @IsString({ message: 'Invalid quiz option(s).', each: true })
  @IsNotEmpty({ message: 'Quiz option(s) are required.' })
  options: string[];
}

export class CreateLectureDto {
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course.' },
  )
  @IsNotEmpty({ message: 'No course provided.' })
  courseId: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid group id.' },
  )
  @IsNotEmpty({ message: 'Group id is required.' })
  groupId: number;

  @IsString({ message: 'Invalid lecture title.' })
  @IsNotEmpty({ message: 'Lecture title is required.' })
  @MinLength(10, { message: 'Lecture title must be minimum 10 characters.' })
  @MaxLength(200, { message: 'Lecture title must be maximum 200 characters.' })
  title: string;

  @IsOptional()
  @IsBoolean({ message: 'Invalid preview value.' })
  preview?: boolean;

  @IsString({ message: 'Invalid lecture video.' })
  @IsNotEmpty({ message: 'Lecture video is required.' })
  @MaxLength(200, { message: 'Invalid lecture video provided.' })
  video: string;

  @IsString({ message: 'Invalid lecture thumbnail.' })
  @IsNotEmpty({ message: 'Lecture thumbnail is required.' })
  @MaxLength(200, { message: 'Invalid lecture thumbnail provided.' })
  thumbnail: string;

  @IsString({ message: 'Invalid lecture description.' })
  @IsNotEmpty({ message: 'Lecture description is required.' })
  @MinLength(100, {
    message: 'Lecture description must be minimum 100 characters.',
  })
  @MaxLength(1000, {
    message: 'Lecture description must be maximum 1000 characters.',
  })
  description: string;

  @IsOptional()
  @IsArray({ message: 'Attachments need to be an array.' })
  @ValidateNested({ message: 'Invalid attachment format.' })
  attachments?: AttachmentsDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAssignmentDto)
  assignment?: CreateAssignmentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizQuestion)
  @IsArray({ message: 'Quiz need to be an array' })
  quiz?: QuizQuestion[];

  index: number;
  duration: number;
}

export class UpdateAssignmentDto {
  @IsOptional()
  @Min(1, { message: 'Invalid deadline.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid deadline.' },
  )
  deadline?: number;

  @IsOptional()
  @Min(1, { message: 'Invalid assignment min mark.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid assignment min marks .' },
  )
  minMarks?: number;

  @IsOptional()
  @Min(100, { message: 'Invalid assignment max mark.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid assignment max marks .' },
  )
  maxMarks?: number;

  @IsOptional()
  @IsString({ message: 'Invalid assignment title .' })
  title?: string;

  // @IsOptional()
  // @IsArray({ message: 'Attachments need to be a list.' })
  // @IsString({ message: 'Invalid attachment', each: true })
  // attachments?: string[];
  @IsOptional()
  @IsArray({ message: 'Attachments need to be an array.' })
  @ValidateNested({ message: 'Invalid attachment format.' })
  attachments?: AttachmentsDto[];
}

export class UpdateLectureDto {
  @Min(1)
  @IsNotEmpty({ message: 'No course provided.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid lecture.' })
  id: number;

  @IsOptional()
  @IsString({ message: 'Invalid lecture title.' })
  @IsNotEmpty({ message: 'Lecture title is required.' })
  @MinLength(10, { message: 'Lecture title must be minimum 10 characters.' })
  @MaxLength(200, { message: 'Lecture title must be maximum 200 characters.' })
  title?: string;

  @IsOptional()
  @IsBoolean({ message: 'Invalid preview value.' })
  preview?: boolean;

  @IsOptional()
  @IsString({ message: 'Invalid lecture video.' })
  @IsNotEmpty({ message: 'Lecture video is required.' })
  @MaxLength(200, { message: 'Invalid lecture video provided.' })
  video?: string;

  @IsOptional()
  @IsString({ message: 'Invalid lecture thumbnail.' })
  @IsNotEmpty({ message: 'Lecture thumbnail is required.' })
  @MaxLength(200, { message: 'Invalid lecture thumbnail provided.' })
  thumbnail?: string;

  @IsOptional()
  @IsString({ message: 'Invalid lecture description.' })
  @IsNotEmpty({ message: 'Lecture description is required.' })
  @MinLength(100, {
    message: 'Lecture description must be minimum 100 characters.',
  })
  @MaxLength(1000, {
    message: 'Lecture description must be maximum 1000 characters.',
  })
  description?: string;

  // @IsOptional()
  // @IsArray({ message: 'Attachments format not correct .' })
  // @IsString({ each: true, message: 'Invalid attachment.' })
  // @MaxLength(200, { each: true, message: 'Invalid attachment.' })
  // attachments?: string[];
  @IsOptional()
  @IsArray({ message: 'Attachments need to be an array.' })
  @ValidateNested({ message: 'Invalid attachment format.' })
  attachments?: AttachmentsDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateAssignmentDto)
  assignment?: UpdateAssignmentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateQuizQuestion)
  @IsArray({ message: 'Quiz need to be an array' })
  quiz?: UpdateQuizQuestion[];

  duration: number;
}

export class ListLecturesInstructorDto {
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course.' },
  )
  @IsNotEmpty({ message: 'No course provided.' })
  courseId: number;

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
}

export class ListLecturesEnrolledDto {
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course.' },
  )
  @IsNotEmpty({ message: 'No course provided.' })
  courseId: number;

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

  ip: string;
  student: User;
}

export class ListLecturesGroupedEnrolledDto {
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course.' },
  )
  @IsNotEmpty({ message: 'No course provided.' })
  courseId: number;

  ip: string;
  student: User;
}

export class ListLecturesPreviewDto {
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course.' },
  )
  @IsNotEmpty({ message: 'No course provided.' })
  courseId: number;

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
}

export class GetLectureByIdInstructorDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid lecture id.' },
  )
  @IsNotEmpty({ message: 'Lecture id is required.' })
  id: number;

  ip: string;
  instructor: User;
}

export class GetLectureByIdDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid lecture id.' },
  )
  @IsNotEmpty({ message: 'Lecture id is required.' })
  id: number;

  ip: string;
  student: User;
}

export class DeleteLectureDto {
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid lecture id.' },
  )
  @IsNotEmpty({ message: 'Lecture id is required.' })
  id: number;
}

export class TrackLectureProgressDto {
  @Min(1, { message: 'Invalid lecture id.' })
  @IsNotEmpty({ message: 'Lecture id is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid lecture id.' },
  )
  lectureId: number;

  @IsNotEmpty({ message: 'Duration is required.' })
  @Min(1, { message: 'Duration must be min 1 sec.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid duration.' },
  )
  duration: number;

  user: User;
}

export class CreateLectureGroupDto {
  @IsString({ message: 'Invalid group title.' })
  @IsNotEmpty({ message: 'Group title is required' })
  title: string;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid course id.' },
  )
  @IsNotEmpty({ message: 'Course id is required.' })
  courseId: number;

  // @IsNumber(
  //   { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
  //   { message: 'Invalid index.' },
  // )
  // @IsNotEmpty({ message: 'Index is required.' })
  index: number;
  instructor: User;
}

export class ListLectureGroupsDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid course id.' },
  )
  @IsNotEmpty({ message: 'Course id is required.' })
  courseId: number;

  instructor: User;
}

export class DeleteLectureGroupDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid lecture group id.' },
  )
  @IsNotEmpty({ message: 'Group id is required.' })
  id: number;

  instructor: User;
}

export class ReArrangeLectureGroupDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid group id.' },
  )
  @IsNotEmpty({ message: 'Group id is required.' })
  groupId: number;

  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid group index' },
  )
  @IsNotEmpty({ message: 'Group index is required.' })
  index: number;

  instructor: User;
}

export class ReArrangeLectureDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid lecture id.' },
  )
  @IsNotEmpty({ message: 'lecture id is required.' })
  id: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid group id.' },
  )
  @IsNotEmpty({ message: 'Group id is required.' })
  groupId: number;

  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid index' },
  )
  @IsNotEmpty({ message: 'Index is required.' })
  index: number;

  instructor: User;
}
