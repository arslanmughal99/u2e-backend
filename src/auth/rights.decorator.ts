import { SetMetadata } from '@nestjs/common';
import { PermitedRight } from './rights.guard';

export const Rights = (arg: PermitedRight) => SetMetadata('right', arg);
