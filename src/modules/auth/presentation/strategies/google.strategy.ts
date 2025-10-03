import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GOOGLE_CONFIG } from '../../../../config/google.config';
import { URLS } from '../../../../shared/constants/urls.constant';
import { AuthUserService } from '../../application/auth-user.service';
import { TokenService } from '../../infrastructure/token.repository';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authUserService: AuthUserService,
    private tokenService: TokenService,
  ) {
    const clientID = GOOGLE_CONFIG.clientID;
    const clientSecret = GOOGLE_CONFIG.clientSecret;
    const callbackURL = URLS.GOOGLE_CALLBACK;

    if (!clientID || !clientSecret) {
      console.warn(
        'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
      );
    }

    super({
      clientID: clientID || 'dummy-client-id',
      clientSecret: clientSecret || 'dummy-client-secret',
      callbackURL: callbackURL || 'http://localhost:3107/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;
      const email = emails[0].value;
      const fullName = `${name.givenName} ${name.familyName}`;

      // Check if user exists
      let user = await this.authUserService.findUserByEmail(email);

      if (user) {
        // User exists, generate tokens
        const tokens = await this.tokenService.createTokensForUser(
          user.id,
          user.email,
          user.role,
        );

        const result = {
          success: true,
          message: 'Google login successful',
          user: {
            id: user.id,
            email: user.email,
            fullName: user.profile.fullName,
            avatar: user.profile.avatar,
            role: user.role,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };

        done(null, result);
      } else {
        // User doesn't exist, create new user
        const newUser = await this.authUserService.createUserFromGoogle({
          googleId: id,
          email,
          fullName: fullName,
          avatar: photos[0]?.value,
        });

        // Save the new user
        await this.authUserService.saveUser(newUser);

        // Generate tokens for new user
        const tokens = await this.tokenService.createTokensForUser(
          newUser.id,
          newUser.email,
          newUser.role,
        );

        const result = {
          success: true,
          message: 'Google registration successful',
          user: {
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.profile.fullName,
            avatar: newUser.profile.avatar,
            role: newUser.role,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };

        done(null, result);
      }
    } catch (error) {
      console.error('Google auth error:', error);
      done(error, false);
    }
  }
}
