/**
 * Token Value Object
 * Encapsulates token validation and security
 */
export class Token {
  private readonly _value: string;
  private readonly _expiresAt?: Date;

  constructor(value: string, expiresAt?: Date) {
    this.validateToken(value);
    this._value = value;
    this._expiresAt = expiresAt;
  }

  get value(): string {
    return this._value;
  }

  get expiresAt(): Date | undefined {
    return this._expiresAt;
  }

  private validateToken(token: string): void {
    if (!token) {
      throw new Error('Token is required');
    }

    if (token.trim() !== token) {
      throw new Error('Token cannot have leading or trailing whitespace');
    }

    if (token.length < 10) {
      throw new Error('Token is too short');
    }
  }

  isExpired(): boolean {
    if (!this._expiresAt) {
      return false;
    }
    return new Date() > this._expiresAt;
  }

  equals(other: Token): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return `Token(${this._value.substring(0, 10)}...)`; // Only show first 10 chars for security
  }
}
