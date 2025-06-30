import {
  Max,
  Min,
  IsString,
  IsNumber,
  MaxLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { User } from '@prisma/client';

export class RequestCertificateDto {
  @Min(1, { message: 'Invalid course id .' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid course id.' },
  )
  @IsNotEmpty({ message: 'Course id is required.' })
  courseId: number;

  user: User;
}

export class ListCertificatesDto {
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

  user: User;
}

export class GetCertificateByIdDto {
  @IsString({ message: 'Invalid certificate id.' })
  @IsNotEmpty({ message: 'Certificate id is required.' })
  id: string;
}
