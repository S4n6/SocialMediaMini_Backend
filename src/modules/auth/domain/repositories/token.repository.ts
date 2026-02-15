/**
 * Token Repository Interface - Domain Layer
 * Pure domain contract for token operations
 */
export interface ITokenRepository {
  /**
   * Generate access token for user
   */
  generateAccessToken(userId: string, email: string, role: string): string;

  /**
   * Generate refresh token for session
   */
  generateRefreshToken(userId: string, sessionId: string): string;

  /**
   * Create both access and refresh tokens for user
   */
  createTokensForUser(
    userId: string,
    email: string,
    role: string,
    userAgent?: string,
    ipAddress?: string,
    deviceName?: string,
    deviceType?: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
  }>;

  /**
   * Revoke refresh token
   */
  revokeRefreshToken(refreshToken: string): Promise<void>;

  /**
   * Revoke all user tokens
   */
  revokeAllUserTokens(userId: string): Promise<void>;

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(
    userId: string,
    email: string,
  ): Promise<string>;
}
