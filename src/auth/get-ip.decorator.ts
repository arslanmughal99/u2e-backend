import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const GetRealIp = createParamDecorator(
  (_, context: ExecutionContext) => {
    return context.switchToHttp().getRequest().headers['x-real-ip'];
  },
);
