import {
  Min,
  Max,
  IsNumber,
  IsString,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { User } from '@prisma/client';

// export class CreateBlogDto {
//   @IsString({ message: 'Invalid blog title.' })
//   @IsNotEmpty({ message: 'Blog title is required.' })
//   @MinLength(5, { message: 'Title should be minimum 5 characters.' })
//   @MaxLength(100, { message: 'Title should be minimum 5 characters.' })
//   title: string;

//   @IsString({ message: 'Invalid blog content.' })
//   @IsNotEmpty({ message: 'Blog content is required.' })
//   @MaxLength(1000, {
//     message: 'Blog content should be minimum 5 characters.',
//   })
//   @MinLength(5, { message: 'Blog content should be minimum 5 characters.' })
//   content: string;

//   user: User;
// }

// export class UpdateBlogDto {
//   @Min(1, { message: 'Invalid blog id.' })
//   @IsNotEmpty({ message: 'Blog id is required.' })
//   @IsNumber(
//     { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
//     { message: 'Blog id is required.' },
//   )
//   id: number;

//   @IsOptional()
//   @IsString({ message: 'Invalid blog title.' })
//   @MinLength(5, { message: 'Title should be minimum 5 characters.' })
//   @MaxLength(100, { message: 'Title should be minimum 5 characters.' })
//   title?: string;

//   @IsOptional()
//   @IsString({ message: 'Invalid blog content.' })
//   @MaxLength(1000, {
//     message: 'Blog content should be minimum 5 characters.',
//   })
//   @MinLength(5, { message: 'Blog content should be minimum 5 characters.' })
//   content?: string;

//   user: User;
// }

// export class DeleteBlogDto {
//   @Min(1, { message: 'Invalid blog id.' })
//   @IsNotEmpty({ message: 'Blog id is required.' })
//   @IsNumber(
//     { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
//     { message: 'Blog id is required.' },
//   )
//   id: number;

//   user: User;
// }

export class ListBlogsDto {
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
  @Min(1, { message: 'Invalid category provided.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid category provided.' },
  )
  categoryId?: number;

  user: User;
}

export class GetBlogByIdDto {
  @Min(1, { message: 'Invalid blog id.' })
  @IsNotEmpty({ message: 'Blog id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Blog id is required.' },
  )
  id: number;

  user: User;
}

export class CreateBlogCommentDto {
  @Min(1, { message: 'Invalid blog id.' })
  @IsNotEmpty({ message: 'Blog id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Blog id is required.' },
  )
  blogId: number;

  @IsString({ message: 'Invalid comment.' })
  @IsNotEmpty({ message: 'Comment is required.' })
  @MaxLength(10000, {
    message: 'Comment should be less then 10000 characters.',
  })
  comment: string;

  user: User;
}

export class ListBlogCommentsDto {
  @Min(1, { message: 'Invalid blog id.' })
  @IsNotEmpty({ message: 'Blog id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Blog id is required.' },
  )
  blogId: number;

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

export class CreateBlogReactionDto {
  @Min(1, { message: 'Invalid blog id.' })
  @IsNotEmpty({ message: 'Blog id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Blog id is required.' },
  )
  blogId: number;

  user: User;
}

export class DeleteBlogReactionDto {
  @Min(1, { message: 'Invalid blog id.' })
  @IsNotEmpty({ message: 'Blog id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Blog id is required.' },
  )
  blogId: number;

  user: User;
}
