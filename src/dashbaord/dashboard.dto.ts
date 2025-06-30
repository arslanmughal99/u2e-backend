import { User } from '@prisma/client';
import { IsOptional, Max, Min, IsNumber } from 'class-validator';

export class DashboardStudentDto {
  @IsOptional()
  @Max(3000, { message: 'Invalid year provided .' })
  @Min(2023, { message: 'Min year should be 2023.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid year provided.' },
  )
  year?: number;

  student: User;
}

export class DashboardInstructorDto {
  @IsOptional()
  @Max(3000, { message: 'Invalid year provided .' })
  @Min(2023, { message: 'Min year should be 2023.' })
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 0 },
    { message: 'Invalid year provided.' },
  )
  year?: number;

  instructor: User;
}
