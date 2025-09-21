import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JWT } from 'src/config/jwt.config';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
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
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      role: user.role,
      fullName: user.fullName,
    };
  }
}
