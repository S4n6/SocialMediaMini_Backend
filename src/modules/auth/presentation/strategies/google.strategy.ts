import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { GOOGLE_CONFIG } from '../../../../config/google.config';
import { URLS } from '../../../../shared/constants/urls.constant';
import { AuthApplicationService } from '../../application/auth-application.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject('LEGACY_AUTH_APPLICATION_SERVICE')
    private authApplicationService: AuthApplicationService,
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

      // Use application service for Google authentication
      // This delegates business logic to the application layer
      const result = await this.authApplicationService.googleAuth({
        googleId: id,
        email,
        fullName,
        avatar: photos[0]?.value,
        emailVerified: true, // Google emails are pre-verified
      });

      done(null, result);
    } catch (error) {
      console.error('Google auth error:', error);
      done(error, false);
    }
  }
}
