import {
  Min,
  Max,
  IsString,
  IsNumber,
  MaxLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class AdminCreateOrganizationDto {
  @IsString({ message: 'Invalid name' })
  @IsNotEmpty({ message: 'Name is required.' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Invalid cover image.' })
  coverImage?: string;

  @IsOptional()
  @IsString({ message: 'Invalid description.' })
  description?: string;
}

export class AdminUpdateOrganizationDto {
  @Min(0, { message: 'Invalid id.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;

  @IsOptional()
  @IsString({ message: 'Invalid name' })
  name?: string;

  @IsOptional()
  coverImage?: any;

  @IsOptional()
  @IsString({ message: 'Invalid description.' })
  description?: any;
}

export class AdminListOrganizationDto {
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
