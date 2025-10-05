import { Token } from '../value-objects/token.vo';

/**
 * Session Domain Entity
 * Manages user authentication sessions with business logic
 */
export class AuthSession {
  private constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly refreshToken: Token,
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly isRevoked: boolean,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly revokedAt: Date | null,
  ) {
    this.validateInvariants();
  }

  /**
   * Create a new session (factory method)
   */
  static create(props: {
    id: string;
    sessionId: string;
    userId: string;
    refreshToken: Token;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): AuthSession {
    return new AuthSession(
      props.id,
      props.sessionId,
      props.userId,
      props.refreshToken,
      props.ipAddress || null,
      props.userAgent || null,
      false, // Not revoked by default
      new Date(),
      props.expiresAt,
      null, // Not revoked yet
    );
  }

  /**
   * Reconstruct session from persistence (factory method)
   */
  static fromPersistence(props: {
    id: string;
    sessionId: string;
    userId: string;
    refreshToken: Token;
    ipAddress: string | null;
    userAgent: string | null;
    isRevoked: boolean;
    createdAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
  }): AuthSession {
    return new AuthSession(
      props.id,
      props.sessionId,
      props.userId,
      props.refreshToken,
      props.ipAddress,
      props.userAgent,
      props.isRevoked,
      props.createdAt,
      props.expiresAt,
      props.revokedAt,
    );
  }

  /**
   * Revoke the session
   */
  revoke(): AuthSession {
    if (this.isRevoked) {
      throw new Error('Session is already revoked');
    }

    return new AuthSession(
      this.id,
      this.sessionId,
      this.userId,
      this.refreshToken,
      this.ipAddress,
      this.userAgent,
      true, // Now revoked
      this.createdAt,
      this.expiresAt,
      new Date(), // Revoked timestamp
    );
  }

  /**
   * Extend session expiry
   */
  extend(newExpiryDate: Date): AuthSession {
    if (this.isRevoked) {
      throw new Error('Cannot extend a revoked session');
    }

    if (this.isExpired()) {
      throw new Error('Cannot extend an expired session');
    }

    if (newExpiryDate <= this.expiresAt) {
      throw new Error('New expiry date must be later than current expiry date');
    }

    return new AuthSession(
      this.id,
      this.sessionId,
      this.userId,
      this.refreshToken,
      this.ipAddress,
      this.userAgent,
      this.isRevoked,
      this.createdAt,
      newExpiryDate,
      this.revokedAt,
    );
  }

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if session is valid (not expired and not revoked)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked;
  }

  /**
   * Get session duration in minutes
   */
  getDurationInMinutes(): number {
    const durationMs = this.expiresAt.getTime() - this.createdAt.getTime();
    return Math.floor(durationMs / (1000 * 60));
  }

  /**
   * Get time remaining in minutes
   */
  getTimeRemainingInMinutes(): number {
    if (this.isExpired()) {
      return 0;
    }
    const remainingMs = this.expiresAt.getTime() - new Date().getTime();
    return Math.floor(remainingMs / (1000 * 60));
  }

  private validateInvariants(): void {
    if (!this.id) {
      throw new Error('Session ID is required');
    }

    if (!this.sessionId) {
      throw new Error('Session identifier is required');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }

    if (!this.refreshToken) {
      throw new Error('Refresh token is required');
    }

    if (this.expiresAt <= this.createdAt) {
      throw new Error('Expiry date must be after creation date');
    }

    if (this.isRevoked && !this.revokedAt) {
      throw new Error('Revoked sessions must have a revoked timestamp');
    }

    if (!this.isRevoked && this.revokedAt) {
      throw new Error('Non-revoked sessions cannot have a revoked timestamp');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject(): {
    id: string;
    sessionId: string;
    userId: string;
    refreshToken: string;
    ipAddress: string | null;
    userAgent: string | null;
    isRevoked: boolean;
    createdAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
  } {
    return {
      id: this.id,
      sessionId: this.sessionId,
      userId: this.userId,
      refreshToken: this.refreshToken.value,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      isRevoked: this.isRevoked,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      revokedAt: this.revokedAt,
    };
  }
}

// Legacy interfaces for backward compatibility (will be removed gradually)
export interface AuthSessionCreationData {
  sessionId: string;
  userId: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export interface AuthSessionUpdateData {
  isRevoked?: boolean;
  revokedAt?: Date;
}
