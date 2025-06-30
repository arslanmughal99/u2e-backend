import {
  Min,
  Max,
  IsString,
  IsNumber,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { User } from '@prisma/client';

export class AdminCreateBlogDto {
  @IsString({ message: 'Invalid title.' })
  @IsNotEmpty({ message: 'Title is required.' })
  title: string;

  @IsString({ message: 'Invalid image.' })
  @IsNotEmpty({ message: 'Image is required.' })
  image: string;

  @IsString({ message: 'Invalid content.' })
  @IsNotEmpty({ message: 'Image is content.' })
  content: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid category id.' },
  )
  categoryId?: number;

  admin: User;
}

export class AdminUpdateBlogDto {
  @Min(0, { message: 'Invalid id.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;

  @IsOptional()
  @IsString({ message: 'Invalid title.' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Invalid image.' })
  image?: string;

  @IsOptional()
  @IsString({ message: 'Invalid content.' })
  content?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid category id.' },
  )
  categoryId?: number;
}

export class AdminListBlogsDto {
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
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid category id.' },
  )
  categoryId?: number;
}

export class AdminGetBlogByIdDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;
}

export class AdminDeleteBlogByIdDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;
}
