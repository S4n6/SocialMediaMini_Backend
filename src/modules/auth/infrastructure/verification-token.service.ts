import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JWT } from '../../../config/jwt.config';
// Legacy service - interface moved to application layer

export interface EmailVerificationPayload {
  userId: string;
  email: string;
  purpose: 'email-verification';
  iat?: number;
  exp?: number;
}

export interface PasswordResetPayload {
  userId: string;
  email: string;
  purpose: 'password-reset';
  iat?: number;
  exp?: number;
}

@Injectable()
export class VerificationTokenService {
  // Legacy service
  constructor(private jwtService: JwtService) {}

  /**
   * Generate JWT token for email verification
   * @param userId User ID
   * @param email User email
   * @returns JWT token with 24 hours expiration
   */
  generateEmailVerificationToken(userId: string, email: string): string {
    const payload: EmailVerificationPayload = {
      userId,
      email,
      purpose: 'email-verification',
    };

    return this.jwtService.sign(payload, {
      secret: JWT.SECRET,
      expiresIn: '24h', // 24 hours for email verification
    });
  }

  /**
   * Generate JWT token for password reset
   * @param userId User ID
   * @param email User email
   * @returns JWT token with 15 minutes expiration
   */
  generatePasswordResetToken(userId: string, email: string): string {
    const payload: PasswordResetPayload = {
      userId,
      email,
      purpose: 'password-reset',
    };

    return this.jwtService.sign(payload, {
      secret: JWT.SECRET,
      expiresIn: '15m', // 15 minutes for password reset
    });
  }

  /**
   * Verify and decode email verification token
   * @param token JWT token
   * @returns Decoded payload or null if invalid/expired
   */
  async verifyEmailVerificationToken(
    token: string,
  ): Promise<EmailVerificationPayload | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: JWT.SECRET,
      }) as EmailVerificationPayload;

      // Check if token is for email verification
      if (payload.purpose !== 'email-verification') {
        return null;
      }

      return payload;
    } catch (error) {
      // Token is invalid, expired, or malformed
      return null;
    }
  }

  /**
   * Verify and decode password reset token
   * @param token JWT token
   * @returns Decoded payload or null if invalid/expired
   */
  async verifyPasswordResetToken(
    token: string,
  ): Promise<PasswordResetPayload | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: JWT.SECRET,
      }) as PasswordResetPayload;

      // Check if token is for password reset
      if (payload.purpose !== 'password-reset') {
        return null;
      }

      return payload;
    } catch (error) {
      // Token is invalid, expired, or malformed
      return null;
    }
  }

  /**
   * Check if token is expired without throwing error
   * @param token JWT token
   * @returns true if expired, false if valid
   */
  isTokenExpired(token: string): boolean {
    try {
      this.jwtService.verify(token, { secret: JWT.SECRET });
      return false;
    } catch (error) {
      return true;
    }
  }

  /**
   * Decode token without verification (for debugging)
   * @param token JWT token
   * @returns Decoded payload or null
   */
  decodeToken(token: string): any {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      return null;
    }
  }
}
