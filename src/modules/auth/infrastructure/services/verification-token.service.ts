import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { JWT } from '../../../../config/jwt.config';
// Legacy service - interface moved to application layer

type TokenVerificationStatus = 'valid' | 'expired' | 'invalid';

interface TokenVerificationResult<T> {
  payload: T | null;
  status: TokenVerificationStatus;
}

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
  async verifyEmailVerificationTokenWithStatus(
    token: string,
  ): Promise<TokenVerificationResult<EmailVerificationPayload>> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: JWT.SECRET,
      });

      // Check if token is for email verification
      if (payload.purpose !== 'email-verification') {
        return { payload: null, status: 'invalid' };
      }

      return { payload, status: 'valid' };
    } catch (error) {
      return {
        payload: null,
        status: this.getTokenStatusFromError(error),
      };
    }
  }

  async verifyEmailVerificationToken(
    token: string,
  ): Promise<EmailVerificationPayload | null> {
    const result = await this.verifyEmailVerificationTokenWithStatus(token);
    return result.payload;
  }

  /**
   * Verify and decode password reset token
   * @param token JWT token
   * @returns Decoded payload or null if invalid/expired
   */
  async verifyPasswordResetTokenWithStatus(
    token: string,
  ): Promise<TokenVerificationResult<PasswordResetPayload>> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: JWT.SECRET,
      });

      // Check if token is for password reset
      if (payload.purpose !== 'password-reset') {
        return { payload: null, status: 'invalid' };
      }

      return { payload, status: 'valid' };
    } catch (error) {
      return {
        payload: null,
        status: this.getTokenStatusFromError(error),
      };
    }
  }

  async verifyPasswordResetToken(
    token: string,
  ): Promise<PasswordResetPayload | null> {
    const result = await this.verifyPasswordResetTokenWithStatus(token);
    return result.payload;
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

  private getTokenStatusFromError(error: unknown): TokenVerificationStatus {
    if (error instanceof TokenExpiredError) {
      return 'expired';
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      (error as { name: string }).name === 'TokenExpiredError'
    ) {
      return 'expired';
    }

    return 'invalid';
  }
}
