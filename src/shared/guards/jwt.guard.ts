import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SKIP_GUARDS_KEY } from 'src/shared/decorators/skipGuard.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const skipGuards = this.reflector.getAllAndOverride<boolean>(
      SKIP_GUARDS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipGuards) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const clientHeader =
      request.headers['x-client-type'] || request.query.client || '';
    const clientType = String(clientHeader || '').toLowerCase();
    const isWeb = clientType === 'web';

    // For web clients, check for token in cookie if no Authorization header
    if (isWeb && (!authHeader || !authHeader.startsWith('Bearer '))) {
      const accessTokenCookie = request.cookies?.['access_token'];
      console.log('Access token from cookie:', accessTokenCookie);
      if (!accessTokenCookie) {
        throw new UnauthorizedException(
          'Access token not found in cookies or Authorization header',
        );
      }
    } else if (!isWeb && (!authHeader || !authHeader.startsWith('Bearer '))) {
      // For non-web clients, require Authorization header
      throw new UnauthorizedException(
        'Authorization header missing or invalid',
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
