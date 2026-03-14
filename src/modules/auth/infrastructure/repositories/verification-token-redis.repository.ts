import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../../../cache/cache.service';
import { IVerificationTokenRepository } from '../../domain/repositories/verification-token.repository';
import {
  VerificationToken,
  VerificationTokenType,
} from '../../domain/entities/verification-token.entity';

/**
 * Key patterns:
 *   verification:{type}:{token}         → stores { id, userId, createdAt }
 *   verification:{type}:user:{userId}   → stores the token string (reverse-lookup for revoke-all)
 *
 * TTL is enforced directly by Redis — no manual expiry needed.
 */

/** TTL per token type in **seconds** */
const TOKEN_TTL_SECONDS: Record<VerificationTokenType, number> = {
  [VerificationTokenType.EMAIL_VERIFICATION]: 24 * 60 * 60, // 24 h
  [VerificationTokenType.PASSWORD_RESET]: 15 * 60, // 15 min
};

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

  // ── Key helpers ──────────────────────────────────────────────────────

  /** Primary key: look up payload by opaque token string */
  private tokenKey(type: VerificationTokenType, token: string): string {
    return `verification:${type}:${token}`;
  }

  /** Reverse key: look up the current token string for a given user+type */
  private userKey(type: VerificationTokenType, userId: string): string {
    return `verification:${type}:user:${userId}`;
  }

  // ── IVerificationTokenRepository ─────────────────────────────────────

  async save(token: VerificationToken): Promise<void> {
    const ttl = TOKEN_TTL_SECONDS[token.type];

    const payload: RedisTokenPayload = {
      id: token.id,
      userId: token.userId,
      createdAt: token.createdAt.toISOString(),
    };

    // Store token data (primary key)
    await this.cache.set(
      this.tokenKey(token.type, token.token),
      payload,
      ttl,
    );

    // Store reverse-lookup (user → token string) with the same TTL
    await this.cache.set(
      this.userKey(token.type, token.userId),
      token.token,
      ttl,
    );

    this.logger.debug(
      `Saved ${token.type} token for user ${token.userId} (TTL: ${ttl}s)`,
    );
  }

  async findByToken(token: string): Promise<VerificationToken | null> {
    // We don't know the type yet, so check both
    for (const type of Object.values(VerificationTokenType)) {
      const key = this.tokenKey(type, token);
      const payload = await this.cache.get<RedisTokenPayload>(key);

      if (payload) {
        // Compute expiresAt from the TTL config — the token is guaranteed
        // not-expired if Redis still holds the key.
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
          usedAt: null, // if it exists in Redis, it hasn't been consumed
        });
      }
    }
    return null;
  }

  /**
   * Consume (delete) a token after a successful business operation.
   * Deletes both the primary key and the reverse user→token key.
   */
  async consume(
    token: string,
    type: VerificationTokenType,
    userId: string,
  ): Promise<void> {
    await this.cache.del(this.tokenKey(type, token));
    await this.cache.del(this.userKey(type, userId));
    this.logger.debug(`Consumed ${type} token for user ${userId}`);
  }


  async revokeAllForUser(
    userId: string,
    type: VerificationTokenType,
  ): Promise<void> {
    // Look up the current token string from the reverse key
    const existingToken = await this.cache.get<string>(
      this.userKey(type, userId),
    );

    if (existingToken) {
      // Delete primary token key
      await this.cache.del(this.tokenKey(type, existingToken));
      // Delete reverse user key
      await this.cache.del(this.userKey(type, userId));
      this.logger.debug(
        `Revoked existing ${type} token for user ${userId}`,
      );
    }
  }

  async deleteExpired(): Promise<number> {
    // No-op — Redis handles TTL-based expiry automatically.
    return 0;
  }
}
