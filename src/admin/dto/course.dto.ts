import {
  Min,
  Max,
  IsEnum,
  IsString,
  IsNumber,
  MaxLength,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { CourseType } from '../../course/course.dto';

export class AdminListCoursesDto {
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
  @IsBoolean({ message: 'Invalid approved value' })
  @Transform(({ obj }) => {
    return obj.approved === 'true';
  })
  approved?: boolean;

  @IsOptional()
  @IsEnum(CourseType, { message: 'Invalid course type value.' })
  courseType?: CourseType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid category .' })
  categoryId?: number;
}

export class AdminGetCourseByIdDto {
  @IsNotEmpty({ message: 'Course id is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid Course id.' },
  )
  id: number;
}

export class AdminUpdateCourseDto {
  @IsNotEmpty({ message: 'Course id is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid Course id.' },
  )
  id: number;

  @IsOptional()
  @IsBoolean({ message: 'Invalid approved value' })
  approved?: boolean;
}
