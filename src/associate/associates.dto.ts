import {
  Min,
  Max,
  IsString,
  IsNumber,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class InviteAssociateDto {
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid course.' },
  )
  @IsNotEmpty({ message: 'Course id is required.' })
  courseId: number;

  @IsString({ message: 'Invalid username.' })
  @MinLength(2, { message: 'username must be minimum 2 characters.' })
  @MaxLength(20, { message: 'username must be maximum 20 characters.' })
  @IsNotEmpty({ message: 'Username is required.' })
  associateUsername: string;
}

export class ListAssociateInvitesDto {
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
}

export class AcceptAssociateInviteDto {
  @IsNotEmpty({ message: 'Invite id is required.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid invite id.' })
  id: number;
}

export class ListInstructorAssociatesDto {
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
}
