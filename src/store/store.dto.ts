import {
  Min,
  Max,
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
  MaxLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ProductAvailability, StoreOrderStatus, User } from '@prisma/client';

export enum ProductStatus {
  InStock = 'InStock',
  OutOfStock = 'OutOfStock',
}

export class CreateProduct {
  title: string;
  price: number;
  virtual: string;
  images: string[];
  attributes: any;
  category: number;
  shipping: number;
  description: string;
  specifications: any;
  status: ProductStatus;
}

export enum ListProductSortBy {
  Newest = 'Newest',
  // BestSeller = 'BestSeller',
  LowestPrice = 'LowestPrice',
  HighestPrice = 'HighestPrice',
}

export class ListProductsDto {
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
  @IsEnum(ListProductSortBy, { message: 'Invalid sortBy value.' })
  sortBy?: ListProductSortBy;

  @IsOptional()
  @Min(0, { message: 'Invalid categoryId.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid categoryId.' },
  )
  categoryId?: number;

  @IsOptional()
  @IsEnum(ProductAvailability, { message: 'Invalid filterBy value.' })
  filterBy?: ProductAvailability;

  @IsOptional()
  @IsString({ message: 'Invalid search value.' })
  @MaxLength(200, { message: 'Max 200 characters for search.' })
  search?: string;
}

export class GetProductByIdDto {
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid product by id.' },
  )
  @Min(0, { message: 'Invalid product id.' })
  @IsNotEmpty({ message: 'Product id is required.' })
  id: number;
}

export class ListProductReviewsDto {
  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  page: number;

  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  size: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid product id.' },
  )
  @Min(1, { message: 'Invalid product id.' })
  @IsNotEmpty({ message: 'Product id is required.' })
  productId: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid rating provided.' },
  )
  @Min(1, { message: 'Min rating 1 is required.' })
  @Max(5, { message: 'Max rating 5 is required.' })
  rating?: number;

  @IsOptional()
  @IsBoolean({ message: 'Invalid value provided for onlyOwned.' })
  onlyOwned?: boolean;

  user: User;
}

export class ProductFeedbackDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowNaN: false, allowInfinity: false },
    { message: 'Invalid product id.' },
  )
  @IsNotEmpty({ message: 'Product id is required.' })
  productId: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid rating provided.' },
  )
  @IsNotEmpty({ message: 'Rating is required.' })
  @Min(1, { message: 'Rating is required.' })
  @Max(5, { message: 'Rating is required.' })
  rating: number;

  @IsNotEmpty({ message: 'Review is required.' })
  @IsString({ message: 'Review must be plan text.' })
  review: string;
}

export class ListStoreOrdersDto {
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
  @IsEnum(StoreOrderStatus, { message: 'Invalid order status' })
  status?: StoreOrderStatus;

  user: User;
}

export class GetStoreOrderByIdDto {
  @IsNotEmpty({ message: 'Order is required.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Order id is required.' },
  )
  id: number;

  user: User;
}

export class CreateProductReviewDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowNaN: false, allowInfinity: false },
    { message: 'Invalid product id.' },
  )
  @IsNotEmpty({ message: 'product id is required.' })
  productId: number;

  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid rating provided.' },
  )
  @IsNotEmpty({ message: 'Rating is required.' })
  @Min(1, { message: 'Rating should be min 1 star.' })
  @Max(5, { message: 'Rating should be max 5 star.' })
  rating: number;

  @IsNotEmpty({ message: 'Review is required.' })
  @IsString({ message: 'Review must be plan text.' })
  review: string;

  id?: number;
  user: User;
}
