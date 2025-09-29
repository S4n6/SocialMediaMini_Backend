import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationException } from '../../../../shared/exceptions/domain.exception';

/**
 * Username Value Object
 * Ensures username validity and business rules
 */
export class Username extends ValueObject<string> {
  private static readonly USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;
  private static readonly RESERVED_USERNAMES = [
    'admin',
    'administrator',
    'root',
    'system',
    'support',
    'help',
    'api',
    'www',
    'mail',
    'email',
    'test',
    'null',
    'undefined',
  ];

  constructor(username: string) {
    // Normalize username to lowercase
    const normalizedUsername = username?.toLowerCase().trim();
    super(normalizedUsername);
  }

  protected validateInvariants(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('Username cannot be empty');
    }

    if (value.length < 3) {
      throw new ValidationException(
        'Username must be at least 3 characters long',
      );
    }

    if (value.length > 30) {
      throw new ValidationException('Username cannot exceed 30 characters');
    }

    if (!Username.USERNAME_REGEX.test(value)) {
      throw new ValidationException(
        'Username can only contain letters, numbers, dots, underscores, and hyphens',
      );
    }

    if (value.startsWith('.') || value.endsWith('.')) {
      throw new ValidationException('Username cannot start or end with a dot');
    }

    if (value.startsWith('_') || value.endsWith('_')) {
      throw new ValidationException(
        'Username cannot start or end with an underscore',
      );
    }

    if (value.includes('..')) {
      throw new ValidationException('Username cannot contain consecutive dots');
    }

    if (Username.RESERVED_USERNAMES.includes(value)) {
      throw new ValidationException(
        'This username is reserved and cannot be used',
      );
    }
  }

  /**
   * Factory method to create Username from string
   */
  static create(username: string): Username {
    return new Username(username);
  }

  /**
   * Check if username is valid format (without throwing exception)
   */
  static isValidFormat(username: string): boolean {
    try {
      new Username(username);
      return true;
    } catch {
      return false;
    }
  }

  protected isEqual(other: ValueObject<string>): boolean {
    return this.getValue() === other.getValue();
  }
}
