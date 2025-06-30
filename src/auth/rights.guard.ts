/**
 * Rights guard will only apply
 * to instructors and organizations
 */

import {
  Logger,
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { User, UserRole } from '@prisma/client';

export const defaultRights = {
  CanEnroll: false,
  CanCreateCourse: false,
  CanUpdateCourse: false,
};

export type Rights = typeof defaultRights;
export type PermitedRight = keyof Rights;

@Injectable()
export class RightsGuard implements CanActivate {
  private logger = new Logger('RoleGuard');
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const user: User = context.switchToHttp().getRequest().user;

    // Rights gurd will only apply to instructors and organizations
    if (![UserRole.Student, UserRole.Organization].includes(user.role as any)) {
      return true;
    }

    const rights: PermitedRight = this.reflector.get(
      'right',
      context.getHandler(),
    );

    if (rights.length <= 0) return true;

    if ((user.rights as Rights)[rights[0]]) {
      return true;
    }

    return false;
  }
}
