import {
  Min,
  Max,
  IsIn,
  IsArray,
  IsNumber,
  IsObject,
  IsString,
  MaxLength,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ProductAvailability, StoreOrderStatus } from '@prisma/client';

export class AdminCreateProductDto {
  @IsNotEmpty({ message: 'Price is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Invalid price' },
  )
  price: number;

  @IsString({ message: 'Invalid title' })
  @IsNotEmpty({ message: 'Title is required.' })
  title: string;

  @IsString({ message: 'Invalid image(s)', each: true })
  @IsArray({ message: 'Image(s) need to be an array.' })
  @IsNotEmpty({ message: 'Image(s) are required.', each: true })
  images: string[];

  @IsNotEmpty({ message: 'Attibutes are required.' })
  @IsObject({ message: 'Attributes are in invalid format' })
  attributes: any;

  @IsNotEmpty({ message: 'Specifications are required.' })
  @IsObject({ message: 'Specifications are in invalid format' })
  specifications: any;

  @IsBoolean({ message: 'Invalid virtual value.' })
  @IsNotEmpty({ message: 'Virtual need to be required.' })
  virtual: boolean;

  @IsNotEmpty({ message: 'Category is required.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid category id.' },
  )
  categoryId: number;

  @IsString({ message: 'Invalid description' })
  @IsNotEmpty({ message: 'Description is required.' })
  description: string;

  @IsNotEmpty({ message: 'Shipping rate is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Invalid shipping rate' },
  )
  shippingRate: number;

  @IsNotEmpty({ message: 'Availablity is required.' })
  @IsIn([ProductAvailability.InStock, ProductAvailability.OutOfStock], {
    message: 'Availability is required.',
  })
  availability: ProductAvailability;
}

export class AdminUpdateProductDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Invalid price' },
  )
  price?: number;

  @IsOptional()
  @IsString({ message: 'Invalid title' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Invalid image(s)', each: true })
  @IsArray({ message: 'Image(s) need to be an array.' })
  images?: string[];

  @IsOptional()
  @IsObject({ message: 'Attributes are in invalid format' })
  attributes?: any;

  @IsOptional()
  @IsObject({ message: 'Specifications are in invalid format' })
  specifications?: any;

  @IsOptional()
  @IsBoolean({ message: 'Invalid virtual value.' })
  virtual?: boolean;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid category id.' },
  )
  categoryId?: number;

  @IsOptional()
  @IsString({ message: 'Invalid description' })
  description?: string;

  @IsOptional()
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Invalid shipping rate' },
  )
  shippingRate?: number;

  @IsOptional()
  @IsIn([ProductAvailability.InStock, ProductAvailability.OutOfStock], {
    message: 'Availability is required.',
  })
  availability?: ProductAvailability;
}

export class AdminDeleteProductDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;
}

export class AdminListProductsDto {
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

  @IsOptional()
  @Transform(({ obj }) => {
    return obj.virtual === 'true';
  })
  @IsBoolean({ message: 'Invalid filter value for `vitual`.' })
  virtual?: boolean;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid category id.' },
  )
  categoryId?: number;

  @IsOptional()
  @IsIn([ProductAvailability.InStock, ProductAvailability.OutOfStock], {
    message: 'Invalid availability value.',
  })
  availability?: ProductAvailability;
}

export class AdminGetProductByIdDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;
}

export class AdminListStoreOrdersDto {
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
  @Min(0, { message: 'Invalid user id.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid user id.' },
  )
  userId?: number;

  @IsOptional()
  @IsIn(
    [
      StoreOrderStatus.Paid,
      StoreOrderStatus.Pending,
      StoreOrderStatus.Refunded,
      StoreOrderStatus.Rejected,
      StoreOrderStatus.Returned,
      StoreOrderStatus.Deliverd,
      StoreOrderStatus.Dispatched,
    ],
    { message: 'Invalid order status' },
  )
  status?: StoreOrderStatus;
}

export class AdminGetStoreOrderByIdDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;
}

export class AdminUpdateStoreOrderDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;

  @IsNotEmpty({ message: 'Status is required.' })
  @IsIn(
    [
      StoreOrderStatus.Paid,
      StoreOrderStatus.Pending,
      StoreOrderStatus.Refunded,
      StoreOrderStatus.Rejected,
      StoreOrderStatus.Returned,
      StoreOrderStatus.Deliverd,
      StoreOrderStatus.Dispatched,
    ],
    { message: 'Invalid order status' },
  )
  status: StoreOrderStatus;
}
