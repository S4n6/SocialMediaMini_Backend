import { Token } from '../../domain/value-objects/token.vo';

/**
 * Token Generator Interface - Infrastructure Layer
 * Contract for JWT access and refresh token operations.
 * Verification / password-reset tokens are handled by
 * ISecureTokenGenerator (CryptoTokenGenerator) + Redis.
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
   * Check if token is expired
   */
  isTokenExpired(token: Token): boolean;
}
