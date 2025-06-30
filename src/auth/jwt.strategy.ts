import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Organization, User, UserRole } from '@prisma/client';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRepository } from '../repository/user.repository';

export interface JwtPayload {
  rights?: any;
  role: UserRole;
  username?: string;
  facebookid?: string;
  profileImage: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configs: ConfigService,
    private userRepository: UserRepository,
  ) {
    super({
      ignoreExpiration: false,
      secretOrKey: configs.get('JWT_SESSION_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    let user: User & { organization: Organization };
    if (payload.facebookid) {
      user = await this.userRepository.findUserByFacebookId(payload.facebookid);
    } else {
      user = await this.userRepository.findUserByUsername(payload.username);
    }

    delete user.hash;
    delete user.salt;
    delete user.organizationId;
    delete user.payoutLockTime;

    if (user.role === UserRole.Student) {
      delete user.rights;
      delete user.organization;
    }

    if (user.role === UserRole.Instructor) {
      delete user.organization;
    }

    return user;
  }
}
