import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JWT } from '../../../../config/jwt.config';
import { Request } from 'express';
import { AuthUserService } from '../../application/auth-user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authUserService: AuthUserService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try Bearer token from header (for mobile clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then try cookie (for web clients)
        (request: Request) => {
          const clientType = (
            request.headers['x-client-type'] ||
            request.query.client ||
            ''
          ).toString();
          const isWeb = clientType.toLowerCase() === 'web';

          // Only extract from cookie for web clients
          if (isWeb && request.cookies) {
            return request.cookies['access_token'];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: JWT.SECRET as string,
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.authUserService.findUserById(payload.sub);
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
