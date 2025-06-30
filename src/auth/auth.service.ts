import {
  Logger,
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import { LoginUserDto, RefreshSessionDto } from './auth.dto';
import { UserRepository } from '../repository/user.repository';
import { UPLOAD_SERVICE, UploadService } from '../upload/upload.port';

@Injectable()
export class AuthService {
  private exceptionMsg: string;
  private jwtRefreshKeyExp: string;
  private jwtSessionKeyExp: string;
  private jwtRefreshKeySecret: string;
  private jwtSessionKeySecret: string;
  private logger = new Logger('AuthService');

  constructor(
    private configs: ConfigService,
    private jwtService: JwtService,
    private userRepository: UserRepository,
    @Inject(UPLOAD_SERVICE) private uploadService: UploadService,
  ) {
    this.jwtSessionKeyExp = this.configs.get('JWT_SESSION_EXPIRY');
    this.jwtSessionKeySecret = this.configs.get('JWT_SESSION_SECRET');
    this.jwtRefreshKeyExp = this.configs.get('JWT_REFRESH_TOKEN_EXPIRY');
    this.exceptionMsg = this.configs.get('INTERNAL_SERVER_EXCEPTION_MSG');
    this.jwtRefreshKeySecret = this.configs.get('JWT_REFRESH_TOKEN_SECRET');
  }

  /**
   * @description Login user
   */
  async login(dto: LoginUserDto) {
    const { username, password } = dto;
    const user = await this.userRepository.findUserByUsername(username);

    if (!user) throw new NotFoundException('User not found.');

    const matched = await bcrypt.compare(password, user.hash);
    if (!matched) throw new UnauthorizedException('Password not matched.');

    try {
      const accessToken = await this.jwtService.signAsync(
        {
          role: user.role,
          email: user.email,
          lastName: user.lastName,
          username: user.username,
          firstName: user.firstName,
          ...(user.profileImage
            ? {
                profileImage: this.uploadService.createUserProfileLink(
                  user.profileImage,
                ),
              }
            : {}),
        },
        { expiresIn: this.jwtSessionKeyExp, secret: this.jwtSessionKeySecret },
      );

      const refreshToken = await this.jwtService.signAsync(
        {
          username: user.username,
        },
        { expiresIn: this.jwtRefreshKeyExp, secret: this.jwtRefreshKeySecret },
      );

      return { accessToken, refreshToken };
    } catch (err) {
      this.logger.error('failed to signed jwt payload', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description Login facebook user
   */
  async loginFacebook(user: User) {
    const { facebookId, role } = user;

    try {
      const accessToken = await this.jwtService.signAsync({
        role: role,
        // rights: rights,
        email: user.email,
        facebookid: facebookId,
        lastName: user.lastName,
        firstName: user.firstName,
        ...(user.profileImage
          ? {
              profileImage: this.uploadService.createUserProfileLink(
                user.profileImage,
              ),
            }
          : {}),
      });

      const refreshToken = await this.jwtService.signAsync(
        {
          facebookid: facebookId,
        },
        { expiresIn: this.jwtRefreshKeyExp, secret: this.jwtRefreshKeySecret },
      );

      return { accessToken, refreshToken };
    } catch (err) {
      this.logger.error('failed to signed fb jwt payload', err);
      throw new InternalServerErrorException(this.exceptionMsg);
    }
  }

  /**
   * @description refresh session using refresh token
   */
  async refreshSession(dto: RefreshSessionDto) {
    const { refreshToken } = dto;
    try {
      const payload: { username: string; role: UserRole } =
        await this.jwtService.verifyAsync(refreshToken, {
          secret: this.jwtRefreshKeySecret,
        });

      const user = await this.userRepository.findUserByUsername(
        payload.username,
      );

      const accessToken = await this.jwtService.signAsync({
        // role: payload.role,
        // username: payload.username,
        // profileImage: payload.profileImage,
        role: user.role,
        email: user.email,
        lastName: user.lastName,
        firstName: user.firstName,
        ...(user.profileImage
          ? {
              profileImage: this.uploadService.createUserProfileLink(
                user.profileImage,
              ),
            }
          : {}),
        ...(user.facebookId
          ? { facebookid: user.facebookId }
          : { username: user.username }),
      });

      return { accessToken };
    } catch (err) {
      this.logger.debug('Jwt refresh token possible expired');
      throw new ForbiddenException('Session expired, Login again.');
    }
  }
}
