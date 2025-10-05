/**
 * Password Value Object
 * Encapsulates password validation rules and security requirements
 */
export class Password {
  private readonly _value: string;

  constructor(value: string) {
    this.validatePassword(value);
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  private validatePassword(password: string): void {
    if (!password) {
      throw new Error('Password is required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new Error('Password is too long');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
      throw new Error('Password must contain at least one digit');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  equals(other: Password): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return '[HIDDEN]'; // Never expose the actual password value
  }
}
