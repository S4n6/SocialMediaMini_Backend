import { Token } from '../../domain/value-objects/token.vo';

/**
 * Token Generator Interface - Domain Layer
 * Contract for token generation and validation operations
 */
export interface ITokenGenerator {
  /**
   * Generate access token for user
   */
  generateAccessToken(
    userId: string,
    email: string,
    role: string,
  ): Promise<Token>;

  /**
   * Generate refresh token for session
   */
  generateRefreshToken(sessionId: string, userId: string): Promise<Token>;

  /**
   * Generate verification token for email verification
   */
  generateVerificationToken(userId: string, email: string): Promise<Token>;

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId: string, email: string): Promise<Token>;

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: Token): Promise<{
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
  }>;

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: Token): Promise<{
    sessionId: string;
    userId: string;
    iat: number;
    exp: number;
  }>;

  /**
   * Verify verification token
   */
  verifyVerificationToken(token: Token): Promise<{
    userId: string;
    email: string;
    iat: number;
    exp: number;
  }>;

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: Token): Promise<{
    userId: string;
    email: string;
    iat: number;
    exp: number;
  }>;

  /**
   * Check if token is expired
   */
  isTokenExpired(token: Token): boolean;
}
