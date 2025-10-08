import { AuthToken } from '../../domain/entities/token.entity';

/**
 * Token Repository Interface - Domain Layer
 * Pure interface for token management operations
 */
export interface ITokenRepository {
  // High-level token operations used by the application
  generateAccessToken(userId: string, email: string): string;

  createTokensForUser(
    userId: string,
    email: string,
    role: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;

  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
  }>;

  revokeRefreshToken(refreshToken: string): Promise<void>;

  revokeAllUserTokens(userId: string): Promise<void>;

  generateEmailVerificationToken(
    userId: string,
    email: string,
  ): Promise<string>;
}
