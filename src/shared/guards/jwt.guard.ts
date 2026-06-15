import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SKIP_GUARDS_KEY } from '../decorators/skipGuard.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if guards should be skipped for this route (via @SkipGuards decorator)
    const skipGuards = this.reflector.getAllAndOverride<boolean>(
      SKIP_GUARDS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipGuards) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const hasBearerToken = authHeader && authHeader.startsWith('Bearer ');
    const hasCookieToken = !!request.cookies?.['access_token'];

    // Auto-detect: Accept token from either Bearer header or cookie
    if (!hasBearerToken && !hasCookieToken) {
      throw new UnauthorizedException(
        'Access token not found. Provide a Bearer token in Authorization header or access_token cookie.',
      );
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('JWT validation failed');
    }
    return user;
  }
}
