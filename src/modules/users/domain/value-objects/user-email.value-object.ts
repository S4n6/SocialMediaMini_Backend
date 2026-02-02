import { ValueObject } from './value-object.base';
import { ValidationException } from '../exceptions/domain.exceptions';

/**
 * UserEmail Value Object
 * Ensures email validity and normalization
 */
export class UserEmail extends ValueObject<string> {
  // RFC 5322 compliant email regex
  // Local part: alphanumeric + . _ % + - (no consecutive dots, no leading/trailing dots)
  // Domain: alphanumeric + hyphen (no underscores)
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*[a-zA-Z0-9]@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$|^[a-zA-Z0-9]@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  constructor(email: string) {
    // Normalize email to lowercase
    const normalizedEmail = email?.toLowerCase().trim();
    super(normalizedEmail);
  }

  protected validateInvariants(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('Email cannot be empty');
    }

    if (value.length > 255) {
      throw new ValidationException('Email cannot exceed 255 characters');
    }

    // Check for multiple @ symbols
    if ((value.match(/@/g) || []).length !== 1) {
      throw new ValidationException('Email must contain exactly one @ symbol');
    }

    const [localPart, domain] = value.split('@');

    // Validate local part
    if (!localPart || localPart.includes('..')) {
      throw new ValidationException(
        'Email local part cannot contain consecutive dots',
      );
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      throw new ValidationException(
        'Email local part cannot start or end with a dot',
      );
    }

    // Validate domain
    if (!domain || domain.includes('_')) {
      throw new ValidationException('Email domain cannot contain underscores');
    }

    if (!UserEmail.EMAIL_REGEX.test(value)) {
      throw new ValidationException('Invalid email format');
    }
  }

  /**
   * Factory method to create UserEmail from string
   */
  static create(email: string): UserEmail {
    return new UserEmail(email);
  }

  /**
   * Get the domain part of the email
   */
  getDomain(): string {
    return this.getValue().split('@')[1];
  }

  /**
   * Get the local part of the email (before @)
   */
  getLocalPart(): string {
    return this.getValue().split('@')[0];
  }

  protected isEqual(other: ValueObject<string>): boolean {
    return this.getValue() === other.getValue();
  }
}
