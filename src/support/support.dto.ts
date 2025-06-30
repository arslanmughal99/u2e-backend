import {
  Min,
  Max,
  IsEnum,
  IsArray,
  IsNumber,
  IsString,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { TicketStatus, TicketType, User } from '@prisma/client';

import { AttachmentsDto } from '../upload/upload.dto';

export class CreateTicketDto {
  @IsNotEmpty({ message: 'Ticket subject is required.' })
  @IsString({ message: 'Invalid ticket subject.' })
  subject: string;

  @IsNotEmpty({ message: 'Ticket comment is required.' })
  @IsString({ message: 'Invalid ticket comment.' })
  comment: string;

  @IsNotEmpty({ message: 'Ticket type is requried.' })
  @IsEnum(TicketType, { message: 'Invalid ticket type.' })
  type: TicketType;

  @IsOptional()
  @IsArray({ message: 'Attachments need to be an array.' })
  @ValidateNested({ message: 'Invalid attachment format.' })
  attachments?: AttachmentsDto[];

  @IsOptional()
  @Min(1, { message: 'Invalid course provided.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid course provided.' },
  )
  courseId?: number;

  user: User;
}

export class CreateTicketCommentDto {
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

  user: User;
}

export class ListUserTicketsDto {
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

  user: User;
}

export class ListInstructorTicketsDto {
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

  user: User;
}

export class UpdateTicketDto {
  @IsNotEmpty({ message: 'Ticket is required.' })
  @Min(1, { message: 'Invalid ticket provided.' })
  @IsNumber(
    { maxDecimalPlaces: 0, allowInfinity: false, allowNaN: false },
    { message: 'Invalid ticket provided.' },
  )
  ticketId: number;

  @IsEnum(TicketStatus, { message: 'Invalid ticket status' })
  status?: TicketStatus;

  user: User;
}

export class ListTicketCommentsDto {
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

  user: User;
}
