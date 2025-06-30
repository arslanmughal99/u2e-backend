import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';

import { AuthService } from './auth.service';
import { UserRepository } from '../repository/user.repository';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configs: ConfigService,
    private authService: AuthService,
    private userRepository: UserRepository,
  ) {
    super({
      scope: 'email',
      clientID: configs.getOrThrow('FB_AUTH_CLIENTID'),
      profileFields: ['emails', 'name'],
      callbackURL: configs.getOrThrow('FB_AUTH_CB_URL'),
      clientSecret: configs.getOrThrow('FB_AUTH_SECRET'),
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ) {
    const user = await this.userRepository.getUserByFacebookId(profile.id);
    if (user) {
      const token = await this.authService.loginFacebook(user);
      done(null, token);
      return user;
    }

    const newUser = await this.userRepository.createStudentFromFacebook({
      facebookid: profile.id,
      email: profile.emails[0].value,
      lastName: profile._json.last_name,
      firstName: profile._json.first_name,
    });
    const token = await this.authService.loginFacebook(newUser);

    done(null, token);
    return newUser;
  }
}
