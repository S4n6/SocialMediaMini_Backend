import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../../../cache/cache.service';
import { IVerificationTokenRepository } from '../../domain/repositories/verification-token.repository';
import {
  VerificationToken,
  VerificationTokenType,
} from '../../domain/entities/verification-token.entity';

/**
 * Redis key patterns:
 *
 * For EMAIL_VERIFICATION (OTP — keyed by userId):
 *   otp:{type}:data:{userId}          → { id, code, createdAt }
 *   otp:{type}:attempts:{userId}      → attempt count (integer string)
 *
 * For PASSWORD_RESET (opaque hex token — keyed by token string):
 *   verification:{type}:{token}       → { id, userId, createdAt }
 *   verification:{type}:user:{userId} → the token string (reverse-lookup for revoke-all)
 *
 * TTL is enforced directly by Redis — no manual expiry needed.
 */

/** TTL per token type in **seconds** */
const TOKEN_TTL_SECONDS: Record<VerificationTokenType, number> = {
  [VerificationTokenType.EMAIL_VERIFICATION]: 10 * 60,  // 10 min
  [VerificationTokenType.PASSWORD_RESET]: 15 * 60,      // 15 min
};

interface RedisOtpPayload {
  id: string;
  code: string;
  userId: string;
  createdAt: string; // ISO-8601
}

interface RedisTokenPayload {
  id: string;
  userId: string;
  createdAt: string; // ISO-8601
}

@Injectable()
export class VerificationTokenRedisRepository
  implements IVerificationTokenRepository
{
  private readonly logger = new Logger(VerificationTokenRedisRepository.name);

  constructor(private readonly cache: RedisCacheService) {}

  // ── Key helpers ──────────────────────────────────────────────────────────

  /** OTP data key (EMAIL_VERIFICATION — keyed by userId) */
  private otpDataKey(type: VerificationTokenType, userId: string): string {
    return `otp:${type}:data:${userId}`;
  }

  /** OTP attempt counter key */
  private otpAttemptsKey(type: VerificationTokenType, userId: string): string {
    return `otp:${type}:attempts:${userId}`;
  }

  /** Password-reset primary key (keyed by opaque token string) */
  private tokenKey(type: VerificationTokenType, token: string): string {
    return `verification:${type}:${token}`;
  }

  /** Password-reset reverse-lookup key (userId → token string) */
  private userKey(type: VerificationTokenType, userId: string): string {
    return `verification:${type}:user:${userId}`;
  }

  // ── IVerificationTokenRepository ────────────────────────────────────────

  async save(token: VerificationToken): Promise<void> {
    const ttl = TOKEN_TTL_SECONDS[token.type];

    if (token.type === VerificationTokenType.EMAIL_VERIFICATION) {
      // OTP: store by userId so we can look it up without knowing the code
      const payload: RedisOtpPayload = {
        id: token.id,
        code: token.token,
        userId: token.userId,
        createdAt: token.createdAt.toISOString(),
      };
      await this.cache.set(this.otpDataKey(token.type, token.userId), payload, ttl);
      // Reset attempt counter on new OTP issuance
      await this.cache.set(this.otpAttemptsKey(token.type, token.userId), 0, ttl);

      this.logger.debug(
        `Saved OTP for user ${token.userId} (TTL: ${ttl}s)`,
      );
    } else {
      // Password-reset: store by opaque token + reverse-lookup by userId
      const payload: RedisTokenPayload = {
        id: token.id,
        userId: token.userId,
        createdAt: token.createdAt.toISOString(),
      };
      await this.cache.set(this.tokenKey(token.type, token.token), payload, ttl);
      await this.cache.set(this.userKey(token.type, token.userId), token.token, ttl);

      this.logger.debug(
        `Saved ${token.type} token for user ${token.userId} (TTL: ${ttl}s)`,
      );
    }
  }

  /**
   * Find a token by its opaque string value.
   * Only used for PASSWORD_RESET tokens (OTPs are looked up by userId).
   */
  async findByToken(token: string): Promise<VerificationToken | null> {
    // Only password-reset tokens use this lookup path
    const type = VerificationTokenType.PASSWORD_RESET;
    const key = this.tokenKey(type, token);
    const payload = await this.cache.get<RedisTokenPayload>(key);

    if (!payload) return null;

    const createdAt = new Date(payload.createdAt);
    const expiresAt = new Date(
      createdAt.getTime() + TOKEN_TTL_SECONDS[type] * 1000,
    );

    return new VerificationToken({
      id: payload.id,
      token,
      type,
      userId: payload.userId,
      expiresAt,
      createdAt,
      usedAt: null,
    });
  }

  /**
   * Find the active OTP for a user (EMAIL_VERIFICATION only).
   */
  async findByUserId(
    userId: string,
    type: VerificationTokenType,
  ): Promise<VerificationToken | null> {
    if (type !== VerificationTokenType.EMAIL_VERIFICATION) {
      // For password reset, there is no userId-keyed lookup — use findByToken
      return null;
    }

    const payload = await this.cache.get<RedisOtpPayload>(
      this.otpDataKey(type, userId),
    );
    if (!payload) return null;

    const createdAt = new Date(payload.createdAt);
    const expiresAt = new Date(
      createdAt.getTime() + TOKEN_TTL_SECONDS[type] * 1000,
    );

    return new VerificationToken({
      id: payload.id,
      token: payload.code,
      type,
      userId: payload.userId,
      expiresAt,
      createdAt,
      usedAt: null,
    });
  }

  /**
   * Consume (delete) a token after a successful business operation.
   */
  async consume(
    token: string,
    type: VerificationTokenType,
    userId: string,
  ): Promise<void> {
    if (type === VerificationTokenType.EMAIL_VERIFICATION) {
      await this.cache.del(this.otpDataKey(type, userId));
      await this.cache.del(this.otpAttemptsKey(type, userId));
      this.logger.debug(`Consumed OTP for user ${userId}`);
    } else {
      await this.cache.del(this.tokenKey(type, token));
      await this.cache.del(this.userKey(type, userId));
      this.logger.debug(`Consumed ${type} token for user ${userId}`);
    }
  }

  async revokeAllForUser(
    userId: string,
    type: VerificationTokenType,
  ): Promise<void> {
    if (type === VerificationTokenType.EMAIL_VERIFICATION) {
      await this.cache.del(this.otpDataKey(type, userId));
      await this.cache.del(this.otpAttemptsKey(type, userId));
      this.logger.debug(`Revoked existing OTP for user ${userId}`);
    } else {
      // Look up the current token string from the reverse key
      const existingToken = await this.cache.get<string>(
        this.userKey(type, userId),
      );
      if (existingToken) {
        await this.cache.del(this.tokenKey(type, existingToken));
        await this.cache.del(this.userKey(type, userId));
        this.logger.debug(`Revoked existing ${type} token for user ${userId}`);
      }
    }
  }

  async getAttemptCount(
    userId: string,
    type: VerificationTokenType,
  ): Promise<number> {
    const count = await this.cache.get<number>(
      this.otpAttemptsKey(type, userId),
    );
    return count ?? 0;
  }

  async incrementAttempts(
    userId: string,
    type: VerificationTokenType,
  ): Promise<void> {
    const key = this.otpAttemptsKey(type, userId);
    const current = await this.cache.get<number>(key);
    const ttl = TOKEN_TTL_SECONDS[type];
    await this.cache.set(key, (current ?? 0) + 1, ttl);
    this.logger.debug(
      `OTP attempt incremented for user ${userId}: ${(current ?? 0) + 1}`,
    );
  }

  async deleteExpired(): Promise<number> {
    // No-op — Redis handles TTL-based expiry automatically.
    return 0;
  }
}
