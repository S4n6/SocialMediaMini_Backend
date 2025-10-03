import {
  AuthToken,
  TokenPayload,
  AccessTokenData,
  RefreshTokenData,
} from '../../domain/entities';

/**
 * Token repository interface for authentication operations
 * This interface defines the contract for token management operations
 * Used by application layer to abstract token data access
 */
export interface ITokenRepository {
  // Token generation
  generateAccessToken(payload: AccessTokenData): Promise<string>;
  generateRefreshToken(): Promise<string>;
  createTokensForUser(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthToken>;

  // Token validation
  validateAccessToken(token: string): Promise<TokenPayload | null>;
  validateRefreshToken(refreshToken: string): Promise<TokenPayload | null>;

  // Token refresh
  refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }>;

  // Token revocation
  revokeToken(token: string, tokenType: 'access' | 'refresh'): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;

  // Token cleanup
  cleanupExpiredTokens(): Promise<number>;

  // Token verification utilities
  decodeToken(token: string): Promise<TokenPayload | null>;
  isTokenExpired(token: string): Promise<boolean>;
}
