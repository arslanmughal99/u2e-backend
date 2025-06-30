import {
  Min,
  Max,
  IsEnum,
  IsArray,
  IsString,
  IsNumber,
  MaxLength,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { TicketStatus, User } from '@prisma/client';
import { AttachmentsDto } from '../../upload/upload.dto';

export class AdminListTicketsDto {
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
  @IsEnum(TicketStatus, { message: 'Invalid status value.' })
  status?: TicketStatus;

  @IsOptional()
  @IsString({ message: 'Invalid search value.' })
  @MaxLength(200, { message: 'Max 200 characters for search.' })
  search?: string;

  @IsOptional()
  @IsDateString(undefined, { message: 'Invalid to date.' })
  to?: Date;

  @IsOptional()
  @IsDateString(undefined, { message: 'Invalid from date.' })
  from?: Date;

  @IsOptional()
  @Min(0, { message: 'Invalid user id.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid user id.' },
  )
  userId?: number;
}

export class AdminUpdateTicketDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;

  @IsNotEmpty({ message: 'Invalid status' })
  @IsEnum(TicketStatus, { message: 'Invalid status value.' })
  status: TicketStatus;
}

export class AdminGetTicketByIdDto {
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid id.' },
  )
  @Min(1, { message: 'Invalid  id .' })
  @IsNotEmpty({ message: 'Id is required.' })
  id: number;
}

export class AdminListTicketCommentsDto {
  @IsNotEmpty({ message: 'Ticket is required.' })
  @Min(1, { message: 'Invalid ticket provided.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid ticket provided.' },
  )
  ticketId: number;

  @IsNotEmpty({ message: 'page is required.' })
  @Min(1, { message: 'Minimum page must be 1.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page.' })
  page: number;

  @IsNotEmpty({ message: 'page size is required.' })
  @Min(10, { message: 'Minimum page size must be 10.' })
  @Max(500, { message: 'Minimum page size must be 500.' })
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Invalid page size.' })
  size: number;

  ip: string;
}

export class AdminCreateTicketCommentDto {
  @IsNotEmpty({ message: 'Ticket comment is required.' })
  @IsString({ message: 'Invalid ticket comment.' })
  comment: string;

  @IsOptional()
  @IsArray({ message: 'Attachments need to be an array.' })
  @ValidateNested({ message: 'Invalid attachment format.' })
  attachments?: AttachmentsDto[];

  @IsNotEmpty({ message: 'Ticket is required.' })
  @Min(1, { message: 'Invalid ticket provided.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid ticket provided.' },
  )
  ticketId: number;

  ip: string;
  user: User;
}
