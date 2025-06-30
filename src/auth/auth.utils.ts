import { verify } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { JwtPayload } from './jwt.strategy';
import { UserRepository } from '../repository/user.repository';

@Injectable()
export class AuthUtils {
  private secretKey: string;
  private logger = new Logger('AuthUtils');
  constructor(
    private configs: ConfigService,
    private userRepository: UserRepository,
  ) {
    this.secretKey = this.configs.get('JWT_SESSION_SECRET');
  }

  async validateUser(_token: string) {
    try {
      const jwt = _token.split(' ')[1];
      const token = verify(jwt, this.secretKey) as JwtPayload;
      const user = await this.userRepository.findUserByUsername(token.username);
      return user;
    } catch (err) {
      this.logger.error('failed to validate user', err);
      throw new UnauthorizedException('Please login again.');
    }
  }
}
