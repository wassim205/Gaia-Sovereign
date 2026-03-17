import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { VaultRequest } from './token-validation.guard';

export interface TokenContext {
  userId: string;
  appId: string;
  approvedFields: string[];
}

export const TokenContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): TokenContext => {
    const request = ctx.switchToHttp().getRequest<VaultRequest>();
    return request.tokenContext!; // Guard ensures it exists
  },
);
