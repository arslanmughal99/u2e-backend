import {
  Min,
  Max,
  IsEnum,
  IsArray,
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { OrderStatus, User } from '@prisma/client';

export class ListOrdersDto {
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
  @IsEnum(OrderStatus, { message: 'Invalid status value.' })
  status?: OrderStatus;

  user: User;
}

export class PlaceOrdersDto {
  @IsOptional()
  @IsArray({ message: 'Invalid product ids.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid product ids', each: true },
  )
  productIds?: number[];

  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray({ message: 'Courses must be array.', each: true })
  courses?: CourseEnrollment[];

  @IsOptional()
  @ValidateNested()
  @IsArray({ message: 'Course bundles must be array.' })
  bundles?: BundleEnrollment[];

  @IsOptional()
  @IsString({ message: 'Invalid coupon.' })
  coupon?: string;

  user: User;
}

export class CourseEnrollment {
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid duration months provided.' },
  )
  @Max(12, { message: 'Course cannot be enrolled for more then 12 months.' })
  months?: number;

  // FIXME: Validation not working here properly
  @IsNotEmpty({ message: 'Course id is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid course id.' },
  )
  courseId: number;
}

export class BundleEnrollment {
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid duration months provided.' },
  )
  @Max(12, {
    message: 'Course bundle cannot be enrolled for more then 12 months.',
  })
  months?: number;

  @IsNotEmpty({ message: 'Bundle id is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Bundle id must be number.' },
  )
  bundleId: number;
}
