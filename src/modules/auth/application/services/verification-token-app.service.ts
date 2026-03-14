import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IVerificationTokenRepository } from '../../domain/repositories/verification-token.repository';
import {
  VerificationToken,
  VerificationTokenType,
} from '../../domain/entities/verification-token.entity';
import { ISecureTokenGenerator } from '../ports/i-secure-token-generator.service';
import {
  VERIFICATION_TOKEN_REPOSITORY_TOKEN,
  SECURE_TOKEN_GENERATOR_TOKEN,
} from '../../auth.constants';
import {
  InvalidTokenException,
  TokenExpiredException,
} from '../../domain/exceptions/auth.exceptions';

/** TTL configuration per token type (milliseconds) */
const TOKEN_TTL: Record<VerificationTokenType, number> = {
  [VerificationTokenType.EMAIL_VERIFICATION]: 24 * 60 * 60 * 1000, // 24 h
  [VerificationTokenType.PASSWORD_RESET]: 15 * 60 * 1000, // 15 min
};

/**
 * Application-layer service for Redis-backed verification tokens.
 *
 * Responsibilities:
 * - Create tokens (invalidating previous ones = race-condition strategy)
 * - Verify & consume tokens
 *
 * Tokens are stored in Redis with TTL-based auto-expiry.
 * "Consumed" means the key is deleted from Redis — no usedAt timestamp.
 */
@Injectable()
export class VerificationTokenAppService {
  constructor(
    @Inject(VERIFICATION_TOKEN_REPOSITORY_TOKEN)
    private readonly tokenRepo: IVerificationTokenRepository,
    @Inject(SECURE_TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: ISecureTokenGenerator,
  ) {}

  /**
   * Create a new verification token for a user.
   *
   * **Race-condition strategy**: all previous tokens of the same
   * type for this user are deleted before inserting a new one. This means
   * only the *latest* token is ever valid.
   */
  async createToken(
    userId: string,
    type: VerificationTokenType,
  ): Promise<string> {
    // Revoke any outstanding tokens of the same type
    await this.tokenRepo.revokeAllForUser(userId, type);

    const raw = this.tokenGenerator.generate(32); // 64-char hex string
    const now = new Date();

    const entity = new VerificationToken({
      id: uuidv4(),
      token: raw,
      type,
      userId,
      expiresAt: new Date(now.getTime() + TOKEN_TTL[type]),
      createdAt: now,
      usedAt: null,
    });

    await this.tokenRepo.save(entity);

    return raw;
  }

  /**
   * Verify a token string.
   *
   * Returns the domain entity if valid.
   * Throws `TokenExpiredException` or `InvalidTokenException`.
   *
   * Note: In the Redis implementation, consumed tokens are *deleted*,
   * so a consumed token simply won't be found (→ InvalidTokenException).
   * The isExpired check is kept as a defence-in-depth safeguard.
   */
  async verifyToken(
    token: string,
    expectedType: VerificationTokenType,
  ): Promise<VerificationToken> {
    const entity = await this.tokenRepo.findByToken(token);

    if (!entity || entity.type !== expectedType) {
      throw new InvalidTokenException(this.typeLabel(expectedType));
    }

    // In Redis, consumed tokens are deleted, so isUsed will always
    // be false for tokens that still exist. Keep the check for
    // defence-in-depth in case of future storage changes.
    if (entity.isUsed) {
      throw new InvalidTokenException(this.typeLabel(expectedType));
    }

    if (entity.isExpired) {
      throw new TokenExpiredException(this.typeLabel(expectedType));
    }

    return entity;
  }

  /**
   * Consume (delete) a token after a successful business operation.
   * Requires the full entity so the repository can locate the Redis
   * key by token string, type, and userId.
   */
  async consumeToken(
    entity: VerificationToken,
  ): Promise<void> {
    await this.tokenRepo.consume(entity.token, entity.type, entity.userId);
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private typeLabel(type: VerificationTokenType): string {
    return type === VerificationTokenType.EMAIL_VERIFICATION
      ? 'email-verification'
      : 'password-reset';
  }
}
