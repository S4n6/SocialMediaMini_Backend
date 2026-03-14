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
   * Find a token by its opaque string value.
   */
  findByToken(token: string): Promise<VerificationToken | null>;

  /**
   * Consume (invalidate) a token after a successful business operation.
   * For DB: deletes or marks the row. For Redis: deletes the key.
   * Requires token string, type, and userId so implementations that
   * don't store an id-to-key index can still locate and delete the entry.
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
   * Delete all expired tokens (cleanup cron target).
   * Returns count of deleted rows.
   */
  deleteExpired(): Promise<number>;
}
