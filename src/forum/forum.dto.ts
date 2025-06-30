import {
  Min,
  Max,
  IsNumber,
  IsString,
  MaxLength,
  IsBoolean,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { User } from '@prisma/client';

export class CreateThreadDto {
  @IsString({ message: 'Invalid thread title.' })
  @IsNotEmpty({ message: 'Thread title is required.' })
  @MinLength(5, { message: 'Title should be minimum 5 characters.' })
  @MaxLength(100, { message: 'Title should be minimum 5 characters.' })
  title: string;

  @IsString({ message: 'Invalid thread content.' })
  @IsNotEmpty({ message: 'Thread content is required.' })
  @MaxLength(1000, {
    message: 'Thread content should be minimum 5 characters.',
  })
  @MinLength(5, { message: 'Thread content should be minimum 5 characters.' })
  content: string;

  user: User;
}

export class UpdateThreadDto {
  @Min(1, { message: 'Invalid thread id.' })
  @IsNotEmpty({ message: 'Thread id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Thread id is required.' },
  )
  id: number;

  @IsOptional()
  @IsString({ message: 'Invalid thread title.' })
  @MinLength(5, { message: 'Title should be minimum 5 characters.' })
  @MaxLength(100, { message: 'Title should be minimum 5 characters.' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Invalid thread content.' })
  @MaxLength(1000, {
    message: 'Thread content should be minimum 5 characters.',
  })
  @MinLength(5, { message: 'Thread content should be minimum 5 characters.' })
  content?: string;

  user: User;
}

export class DeleteThreadDto {
  @Min(1, { message: 'Invalid thread id.' })
  @IsNotEmpty({ message: 'Thread id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Thread id is required.' },
  )
  id: number;

  user: User;
}

export class ListThreadsDto {
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

  @IsOptional()
  @IsString({ message: 'Invalid search value.' })
  @MaxLength(200, { message: 'Max 200 characters for search.' })
  search?: string;

  @IsOptional()
  @IsBoolean({ message: 'Invalid value provided for onlyOwned.' })
  onlyOwned?: boolean;

  user: User;
}

export class GetThreadByIdDto {
  @Min(1, { message: 'Invalid thread id.' })
  @IsNotEmpty({ message: 'Thread id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Thread id is required.' },
  )
  id: number;

  user: User;
}

export class CreateThreadCommentDto {
  @Min(1, { message: 'Invalid thread id.' })
  @IsNotEmpty({ message: 'Thread id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Thread id is required.' },
  )
  threadId: number;

  @IsString({ message: 'Invalid comment.' })
  @IsNotEmpty({ message: 'Comment is required.' })
  @MaxLength(10000, {
    message: 'Comment should be less then 10000 characters.',
  })
  comment: string;

  user: User;
}

export class ListThreadCommentsDto {
  @Min(1, { message: 'Invalid thread id.' })
  @IsNotEmpty({ message: 'Thread id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Thread id is required.' },
  )
  threadId: number;

  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  page: number;

  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  size: number;

  user: User;
}

export class CreateThreadReactionDto {
  @Min(1, { message: 'Invalid thread id.' })
  @IsNotEmpty({ message: 'Thread id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Thread id is required.' },
  )
  threadId: number;

  // @IsNotEmpty({ message: 'Comment is required.' })
  // @IsEnum(ThreadFeedbackReaction, { message: 'Invalid reaction.' })
  // reaction: ThreadFeedbackReaction;

  user: User;
}

export class DeleteThreadReactionDto {
  @Min(1, { message: 'Invalid thread id.' })
  @IsNotEmpty({ message: 'Thread id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Thread id is required.' },
  )
  threadId: number;

  user: User;
}
