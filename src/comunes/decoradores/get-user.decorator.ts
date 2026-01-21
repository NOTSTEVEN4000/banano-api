// src/comunes/decoradores/get-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Este user viene del JwtStrategy (passport)
  },
);