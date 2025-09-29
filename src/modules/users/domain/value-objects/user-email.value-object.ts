import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationException } from '../../../../shared/exceptions/domain.exception';

/**
 * UserEmail Value Object
 * Ensures email validity and normalization
 */
export class UserEmail extends ValueObject<string> {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  constructor(email: string) {
    // Normalize email to lowercase
    const normalizedEmail = email?.toLowerCase().trim();
    super(normalizedEmail);
  }

  protected validateInvariants(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('Email cannot be empty');
    }

    if (!UserEmail.EMAIL_REGEX.test(value)) {
      throw new ValidationException('Invalid email format');
    }

    if (value.length > 255) {
      throw new ValidationException('Email cannot exceed 255 characters');
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
