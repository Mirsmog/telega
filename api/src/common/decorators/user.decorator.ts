import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export interface UserPayload {
  id: number;
  telegramId: string;
  roles: string[];
}

export const User = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: UserPayload }>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
