import { Token } from '../value-objects/token.vo';
import { Email } from '../value-objects/email.vo';

/**
 * Auth Token Domain Entity
 * Represents various types of authentication tokens with business logic
 */
export class AuthToken {
  private constructor(
    public readonly id: string,
    public readonly token: Token,
    public readonly type: TokenType,
    public readonly userId: string,
    public readonly email: Email,
    public readonly isUsed: boolean,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly usedAt: Date | null,
    public readonly metadata: Record<string, any>,
  ) {
    this.validateInvariants();
  }

  /**
   * Create a new token (factory method)
   */
  static create(props: {
    id: string;
    token: Token;
    type: TokenType;
    userId: string;
    email: Email;
    expiresAt: Date;
    metadata?: Record<string, any>;
  }): AuthToken {
    return new AuthToken(
      props.id,
      props.token,
      props.type,
      props.userId,
      props.email,
      false, // Not used by default
      new Date(),
      props.expiresAt,
      null, // Not used yet
      props.metadata || {},
    );
  }

  /**
   * Reconstruct token from persistence (factory method)
   */
  static fromPersistence(props: {
    id: string;
    token: Token;
    type: TokenType;
    userId: string;
    email: Email;
    isUsed: boolean;
    createdAt: Date;
    expiresAt: Date;
    usedAt: Date | null;
    metadata: Record<string, any>;
  }): AuthToken {
    return new AuthToken(
      props.id,
      props.token,
      props.type,
      props.userId,
      props.email,
      props.isUsed,
      props.createdAt,
      props.expiresAt,
      props.usedAt,
      props.metadata,
    );
  }

  /**
   * Mark token as used
   */
  markAsUsed(): AuthToken {
    if (this.isUsed) {
      throw new Error('Token is already used');
    }

    if (this.isExpired()) {
      throw new Error('Cannot use an expired token');
    }

    return new AuthToken(
      this.id,
      this.token,
      this.type,
      this.userId,
      this.email,
      true, // Now used
      this.createdAt,
      this.expiresAt,
      new Date(), // Used timestamp
      this.metadata,
    );
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if token is valid (not expired and not used)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.isUsed;
  }

  /**
   * Check if token can be used for specific purpose
   */
  canBeUsedFor(purpose: TokenType): boolean {
    return this.type === purpose && this.isValid();
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

  /**
   * Get token lifetime in minutes
   */
  getLifetimeInMinutes(): number {
    const lifetimeMs = this.expiresAt.getTime() - this.createdAt.getTime();
    return Math.floor(lifetimeMs / (1000 * 60));
  }

  private validateInvariants(): void {
    if (!this.id) {
      throw new Error('Token ID is required');
    }

    if (!this.token) {
      throw new Error('Token value is required');
    }

    if (!Object.values(TokenType).includes(this.type)) {
      throw new Error('Invalid token type');
    }

    if (!this.userId) {
      throw new Error('User ID is required');
    }

    if (!this.email) {
      throw new Error('Email is required');
    }

    if (this.expiresAt <= this.createdAt) {
      throw new Error('Expiry date must be after creation date');
    }

    if (this.isUsed && !this.usedAt) {
      throw new Error('Used tokens must have a used timestamp');
    }

    if (!this.isUsed && this.usedAt) {
      throw new Error('Unused tokens cannot have a used timestamp');
    }
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject(): {
    id: string;
    token: string;
    type: TokenType;
    userId: string;
    email: string;
    isUsed: boolean;
    createdAt: Date;
    expiresAt: Date;
    usedAt: Date | null;
    metadata: Record<string, any>;
  } {
    return {
      id: this.id,
      token: this.token.value,
      type: this.type,
      userId: this.userId,
      email: this.email.value,
      isUsed: this.isUsed,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      usedAt: this.usedAt,
      metadata: this.metadata,
    };
  }
}

/**
 * Token Type Enum
 */
export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
}

/**
 * Token Pair for authentication
 */
export class TokenPair {
  constructor(
    public readonly accessToken: Token,
    public readonly refreshToken: Token,
    public readonly expiresIn: number,
    public readonly tokenType: string = 'Bearer',
  ) {}

  /**
   * Convert to plain object for API response
   */
  toPlainObject(): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  } {
    return {
      accessToken: this.accessToken.value,
      refreshToken: this.refreshToken.value,
      expiresIn: this.expiresIn,
      tokenType: this.tokenType,
    };
  }
}

// Legacy interfaces for backward compatibility (will be removed gradually)
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenData {
  userId: string;
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AccessTokenData {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}
