import {
  Logger,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserRole } from '@prisma/client';

/**
 * @description extract request from context
 * @param context Request Executaion Context
 */
@Injectable()
export class RoleGuard implements CanActivate {
  private logger = new Logger('RoleGuard');
  constructor(private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const user: User = req.user;
    if (!user)
      throw new ForbiddenException('You are not allowed for this action.');

    const roles = this.reflector.get<UserRole[]>('roles', ctx.getHandler());
    if (!roles)
      throw new ForbiddenException('You are not allowed for this action.');

    if (!roles.includes(user.role))
      throw new ForbiddenException('You are not allowed for this action.');

    return true;
  }
}
