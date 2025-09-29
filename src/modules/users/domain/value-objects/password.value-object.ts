import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationException } from '../../../../shared/exceptions/domain.exception';
import * as bcrypt from 'bcrypt';

/**
 * Password Value Object
 * Handles password hashing and validation
 */
export class Password extends ValueObject<string> {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;

  constructor(hashedPassword: string, isAlreadyHashed = false) {
    if (isAlreadyHashed) {
      super(hashedPassword);
    } else {
      const hashed = Password.hashPassword(hashedPassword);
      super(hashed);
    }
  }

  protected validateInvariants(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('Password cannot be empty');
    }
  }

  /**
   * Create Password from plain text
   */
  static async createFromPlainText(plainPassword: string): Promise<Password> {
    Password.validatePlainPassword(plainPassword);
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    return new Password(hashedPassword, true);
  }

  /**
   * Create Password from already hashed string
   */
  static createFromHash(hashedPassword: string): Password {
    return new Password(hashedPassword, true);
  }

  /**
   * Validate plain password before hashing
   */
  private static validatePlainPassword(plainPassword: string): void {
    if (!plainPassword || plainPassword.trim().length === 0) {
      throw new ValidationException('Password cannot be empty');
    }

    if (plainPassword.length < Password.MIN_LENGTH) {
      throw new ValidationException(
        `Password must be at least ${Password.MIN_LENGTH} characters long`,
      );
    }

    if (plainPassword.length > Password.MAX_LENGTH) {
      throw new ValidationException(
        `Password cannot exceed ${Password.MAX_LENGTH} characters`,
      );
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(plainPassword)) {
      throw new ValidationException(
        'Password must contain at least one lowercase letter',
      );
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(plainPassword)) {
      throw new ValidationException(
        'Password must contain at least one uppercase letter',
      );
    }

    // Check for at least one digit
    if (!/\d/.test(plainPassword)) {
      throw new ValidationException(
        'Password must contain at least one number',
      );
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(plainPassword)) {
      throw new ValidationException(
        'Password must contain at least one special character',
      );
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
    if (
      commonPasswords.some((common) =>
        plainPassword.toLowerCase().includes(common),
      )
    ) {
      throw new ValidationException('Password is too common and weak');
    }
  }

  /**
   * Hash a plain password
   */
  private static hashPassword(plainPassword: string): string {
    Password.validatePlainPassword(plainPassword);
    return bcrypt.hashSync(plainPassword, 12);
  }

  /**
   * Compare plain password with this hashed password
   */
  async compare(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.getValue());
  }

  /**
   * Check if password is valid format (static method)
   */
  static isValidFormat(plainPassword: string): boolean {
    try {
      Password.validatePlainPassword(plainPassword);
      return true;
    } catch {
      return false;
    }
  }

  protected isEqual(other: ValueObject<string>): boolean {
    return this.getValue() === other.getValue();
  }
}
