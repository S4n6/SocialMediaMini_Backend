import {
  VerificationToken,
  VerificationTokenType,
} from '../entities/verification-token.entity';

/**
 * Verification Token Repository Interface - Domain Layer
 * Storage-agnostic contract for verification tokens.
 */
export interface IVerificationTokenRepository {
  /**
   * Persist a new verification token.
   */
  save(token: VerificationToken): Promise<void>;

  /**
   * Find a token by its opaque string value (used for password-reset hex tokens).
   */
  findByToken(token: string): Promise<VerificationToken | null>;

  /**
   * Find the active token for a specific user and type.
   * Used for OTP lookup (keyed by userId, not by code value).
   */
  findByUserId(
    userId: string,
    type: VerificationTokenType,
  ): Promise<VerificationToken | null>;

  /**
   * Consume (invalidate) a token after a successful business operation.
   * For DB: deletes or marks the row. For Redis: deletes the key.
   */
  consume(
    token: string,
    type: VerificationTokenType,
    userId: string,
  ): Promise<void>;

  /**
   * Invalidate (delete) all active tokens of a given type for a user.
   * Used when issuing a new token so old ones become invalid.
   */
  revokeAllForUser(userId: string, type: VerificationTokenType): Promise<void>;

  /**
   * Get the number of failed OTP verification attempts for a user.
   * Used to enforce the MAX_OTP_ATTEMPTS limit.
   */
  getAttemptCount(userId: string, type: VerificationTokenType): Promise<number>;

  /**
   * Increment the failed-attempt counter for a user's OTP.
   */
  incrementAttempts(
    userId: string,
    type: VerificationTokenType,
  ): Promise<void>;

  /**
   * Delete all expired tokens (cleanup cron target).
   * Returns count of deleted rows.
   */
  deleteExpired(): Promise<number>;
}
