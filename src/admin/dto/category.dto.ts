import {
  Min,
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class AdminCreateCategoryDto {
  @IsString({ message: 'Invalid title.' })
  @IsNotEmpty({ message: 'Category title is required.' })
  title: string;

  @IsString({ message: 'Invalid icon.' })
  @IsNotEmpty({ message: 'Category icon is required.' })
  icon: string;
}

export class AdminUpdateCategoryDto {
  @Min(0, { message: 'Invalid category id.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid category id.' },
  )
  @IsNotEmpty({ message: 'Category id is required.' })
  id: number;

  @IsOptional()
  @IsString({ message: 'Invalid title.' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Invalid icon.' })
  icon?: string;
}
