import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { GOOGLE_CONFIG } from 'src/config/google.config';
import { URLS } from 'src/constants/urls.constant';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
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
      const user = {
        googleId: id,
        email: emails[0].value,
        fullName: `${name.givenName} ${name.familyName}`,
        firstName: name.givenName,
        lastName: name.familyName,
        profilePicture: photos[0].value,
        accessToken,
      };

      const result = await this.authService.googleLogin(user);
      done(null, result);
    } catch (error) {
      done(error, false);
    }
  }
}
