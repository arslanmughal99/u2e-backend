import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';
import { JsonWebTokenError } from 'jsonwebtoken';
import { User as UserEntity } from '@prisma/client';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<User>(err: any, _user: User, info: any): any {
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Please login again.');
    } else if (info) {
      throw new ForbiddenException('Invalid session.');
    }
    const user = _user as UserEntity;
    return user;
  }
}
