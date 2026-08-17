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
  // 6-digit OTP: short-lived for UX (10 minutes)
  [VerificationTokenType.EMAIL_VERIFICATION]: 10 * 60 * 1000, // 10 min
  // Password reset: opaque hex token sent by link (15 min)
  [VerificationTokenType.PASSWORD_RESET]: 15 * 60 * 1000, // 15 min
};

/**
 * Application-layer service for Redis-backed verification tokens.
 *
 * Email Verification uses a **6-digit numeric OTP** stored in Redis with a 10-minute TTL.
 * The OTP is looked up by `userId` (not by the code itself) to support attempt counting.
 *
 * Password Reset uses an **opaque 64-char hex token** delivered via a URL link (15 min TTL).
 *
 * Responsibilities:
 * - Create tokens (invalidating previous ones)
 * - Verify & consume tokens
 * - Enforce max-attempt policy for OTPs (max 5 attempts before invalidation)
 */
@Injectable()
export class VerificationTokenAppService {
  /** Maximum failed attempts allowed before the OTP is invalidated */
  private readonly MAX_OTP_ATTEMPTS = 5;

  constructor(
    @Inject(VERIFICATION_TOKEN_REPOSITORY_TOKEN)
    private readonly tokenRepo: IVerificationTokenRepository,
    @Inject(SECURE_TOKEN_GENERATOR_TOKEN)
    private readonly tokenGenerator: ISecureTokenGenerator,
  ) {}

  /**
   * Create a new verification token for a user.
   *
   * - EMAIL_VERIFICATION → 6-digit OTP (tokenGenerator.generateOtp())
   * - PASSWORD_RESET     → 64-char hex token (tokenGenerator.generate(32))
   *
   * Any previous tokens of the same type for this user are revoked first.
   */
  async createToken(
    userId: string,
    type: VerificationTokenType,
  ): Promise<string> {
    // Revoke any outstanding tokens of the same type
    await this.tokenRepo.revokeAllForUser(userId, type);

    const raw =
      type === VerificationTokenType.EMAIL_VERIFICATION
        ? this.tokenGenerator.generateOtp() // 6-digit numeric OTP
        : this.tokenGenerator.generate(32); // 64-char hex

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
   * Verify an opaque token string (used for PASSWORD_RESET).
   *
   * Returns the domain entity if valid.
   * Throws `TokenExpiredException` or `InvalidTokenException`.
   */
  async verifyToken(
    token: string,
    expectedType: VerificationTokenType,
  ): Promise<VerificationToken> {
    const entity = await this.tokenRepo.findByToken(token);

    if (!entity || entity.type !== expectedType) {
      throw new InvalidTokenException(this.typeLabel(expectedType));
    }

    if (entity.isUsed) {
      throw new InvalidTokenException(this.typeLabel(expectedType));
    }

    if (entity.isExpired) {
      throw new TokenExpiredException(this.typeLabel(expectedType));
    }

    return entity;
  }

  /**
   * Verify a 6-digit OTP for email verification.
   *
   * Looks up the OTP by `userId` (not by code) to support attempt counting.
   * Increments the attempt counter on each failed attempt.
   * Invalidates the OTP after MAX_OTP_ATTEMPTS failed attempts.
   *
   * @param userId The user's ID
   * @param code   The 6-digit code submitted by the user
   * @returns The VerificationToken entity if the code is correct
   * @throws InvalidTokenException if code is wrong or OTP not found / exhausted
   * @throws TokenExpiredException if OTP has expired
   */
  async verifyOtp(
    userId: string,
    code: string,
  ): Promise<VerificationToken> {
    const type = VerificationTokenType.EMAIL_VERIFICATION;

    // Find the OTP record for this user
    const entity = await this.tokenRepo.findByUserId(userId, type);

    if (!entity) {
      throw new InvalidTokenException('email-verification OTP');
    }

    if (entity.isExpired) {
      await this.tokenRepo.revokeAllForUser(userId, type);
      throw new TokenExpiredException('email-verification OTP');
    }

    // Check attempt limit
    const attempts = await this.tokenRepo.getAttemptCount(userId, type);
    if (attempts >= this.MAX_OTP_ATTEMPTS) {
      await this.tokenRepo.revokeAllForUser(userId, type);
      throw new InvalidTokenException(
        'email-verification OTP (max attempts exceeded)',
      );
    }

    // Verify the code
    if (entity.token !== code) {
      await this.tokenRepo.incrementAttempts(userId, type);
      throw new InvalidTokenException('email-verification OTP');
    }

    return entity;
  }

  /**
   * Consume (delete) a token after a successful business operation.
   */
  async consumeToken(entity: VerificationToken): Promise<void> {
    await this.tokenRepo.consume(entity.token, entity.type, entity.userId);
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private typeLabel(type: VerificationTokenType): string {
    return type === VerificationTokenType.EMAIL_VERIFICATION
      ? 'email-verification'
      : 'password-reset';
  }
}
