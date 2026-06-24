import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JWT } from '../../../../config/jwt.config';
import { Request } from 'express';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { RedisCacheService } from '../../../cache/cache.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userApplicationService: UserApplicationService,
    private cacheService: RedisCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Try Bearer token from Authorization header (mobile/API clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Fallback to access_token cookie (web clients)
        (request: Request) => {
          return request.cookies?.['access_token'] || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: JWT.SECRET as string,
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    try {
      const logoutAllAt = await this.cacheService.get<number>(
        `auth:logout-all:${payload.sub}`,
      );

      if (
        logoutAllAt !== null &&
        (typeof payload.iat !== 'number' || payload.iat <= logoutAllAt)
      ) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const user = await this.userApplicationService.findUserEntityById(
        payload.sub,
      );
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        fullName: user.profile.fullName,
      };
    } catch (error) {
      console.error('JWT validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
