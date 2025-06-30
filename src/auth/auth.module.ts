import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthUtils } from './auth.utils';
import { RoleGuard } from './role.guard';
import { JwtAuthGuard } from './jwt.guard';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RightsGuard } from './rights.guard';
import { AuthController } from './auth.controller';
import { FacebookStrategy } from './facebook.strategy';
import { RepositoryModule } from '../repository/repository.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  controllers: [AuthController],
  imports: [
    ConfigModule,
    RepositoryModule,
    UploadModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SESSION_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_SESSION_EXPIRY'),
        },
      }),
    }),
  ],
  exports: [
    AuthUtils,
    RoleGuard,
    JwtAuthGuard,
    AuthService,
    JwtStrategy,
    RightsGuard,
    JwtModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    FacebookStrategy,
    JwtAuthGuard,
    RoleGuard,
    RightsGuard,
    AuthUtils,
  ],
})
export class AuthModule {}
