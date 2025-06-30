import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UserService } from './user.service';
import { RegisterService } from './register.service';
import { UploadModule } from '../upload/upload.module';
import { RegisterController } from './register.controller';
import { RepositoryModule } from '../repository/repository.module';
import { InstructorController, UserController } from './user.controller';
import { RewardPointsModule } from '../reward-points/reward-points.module';

@Module({
  providers: [UserService, RegisterService],
  controllers: [UserController, RegisterController, InstructorController],
  imports: [RepositoryModule, ConfigModule, UploadModule, RewardPointsModule],
})
export class UserModule {}
