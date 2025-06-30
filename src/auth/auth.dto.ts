import { IsJWT, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsString({ message: 'Invalid username.' })
  @IsNotEmpty({ message: 'Username is required.' })
  username: string;

  @IsString({ message: 'Invalid password.' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class RefreshSessionDto {
  @IsNotEmpty({ message: 'Refresh required.' })
  @IsJWT({ message: 'Invalid refresh token.' })
  refreshToken: string;
}
