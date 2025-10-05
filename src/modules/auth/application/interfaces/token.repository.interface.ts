import { AuthToken } from '../../domain/entities/token.entity';

/**
 * Token Repository Interface - Domain Layer
 * Pure interface for token management operations
 */
export interface ITokenRepository {
  /**
   * Create new token
   */
  create(token: AuthToken): Promise<AuthToken>;

  /**
   * Find token by ID
   */
  findById(tokenId: string): Promise<AuthToken | null>;

  /**
   * Find token by value
   */
  findByToken(token: string): Promise<AuthToken | null>;

  /**
   * Find tokens by user ID and type
   */
  findByUserIdAndType(userId: string, type: string): Promise<AuthToken[]>;

  /**
   * Update token
   */
  update(tokenId: string, token: Partial<AuthToken>): Promise<AuthToken>;

  /**
   * Delete token
   */
  delete(tokenId: string): Promise<void>;

  /**
   * Delete token by value
   */
  deleteByToken(token: string): Promise<void>;

  /**
   * Delete all tokens by user ID and type
   */
  deleteByUserIdAndType(userId: string, type: string): Promise<void>;

  /**
   * Delete expired tokens
   */
  deleteExpired(): Promise<void>;

  /**
   * Check if token exists and is valid
   */
  isValidToken(token: string): Promise<boolean>;

  /**
   * Mark token as used
   */
  markAsUsed(tokenId: string): Promise<void>;

  // High-level business operations for legacy compatibility
  /**
   * Generate access token for user
   */
  generateAccessToken(userId: string, email: string): string;

  /**
   * Create token pair (access + refresh) for user
   */
  createTokensForUser(
    userId: string,
    email: string,
    role: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;

  /**
   * Refresh access token using refresh token (with rotation)
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
}
