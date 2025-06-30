import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const GetUser = createParamDecorator((_, context: ExecutionContext) => {
  return context.switchToHttp().getRequest().user;
});
