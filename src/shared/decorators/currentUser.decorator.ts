// filepath: c:\PersonalProjects\SocialMediaMini\SocialMediaMini_Backend\src\modules\auth\decorators\current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request?.user as unknown;

    if (!user || typeof user !== 'object') return undefined;

    return data
      ? (user as Record<string, any>)[data]
      : (user as Record<string, any>);
  },
);
