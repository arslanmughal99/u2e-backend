import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsTimeZone,
} from 'class-validator';

export class CreateInstructorDto {
  @IsString({ message: 'Invalid passowrd.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MaxLength(500, { message: 'Password too long.' })
  @MinLength(10, { message: 'Password must be minimum 10 characters.' })
  password: string;

  @IsString({ message: 'Invalid username.' })
  @IsNotEmpty({ message: 'Username is required.' })
  @MinLength(2, { message: 'username must be minimum 2 characters.' })
  @MaxLength(20, { message: 'username must be maximum 20 characters.' })
  username: string;

  @IsOptional()
  @IsString({ message: 'Invalid bio provided.' })
  @MaxLength(200, { message: 'Bio cannot be more than 200 characters long.' })
  bio?: string;

  @IsEmail(undefined, { message: 'Invalid email .' })
  email: string;

  @IsOptional()
  @IsTimeZone({ message: 'Invalid time zone.' })
  timezone?: string;

  @IsString({ message: 'Invalid firstname.' })
  @MaxLength(200, { message: 'First Name too long.' })
  @IsNotEmpty({ message: 'First name is required.' })
  firstName?: string;

  @IsString({ message: 'Invalid lastname.' })
  @MaxLength(200, { message: 'Last Name too long.' })
  @IsNotEmpty({ message: 'Last name is required.' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Invalid job title.' })
  @MaxLength(50, {
    message: 'Job title cannot be more than 50 characters long.',
  })
  jobTitle?: string;
}
