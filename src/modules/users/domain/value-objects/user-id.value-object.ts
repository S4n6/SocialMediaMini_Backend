import { ValueObject } from '../../../../shared/domain/value-object.base';
import { ValidationException } from '../../../../shared/exceptions/domain.exception';

/**
 * UserId Value Object
 * Ensures user ID validity and type safety
 */
export class UserId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
  }

  protected validateInvariants(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationException('User ID cannot be empty');
    }

    if (value.length > 36) {
      throw new ValidationException('User ID cannot exceed 36 characters');
    }

    // UUID format validation (optional - depends on your ID strategy)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationException('User ID must be a valid UUID format');
    }
  }

  /**
   * Factory method to create UserId from string
   */
  static create(value: string): UserId {
    return new UserId(value);
  }

  /**
   * Generate new random UserId
   */
  static generate(): UserId {
    const { randomUUID } = require('crypto');
    return new UserId(randomUUID());
  }

  protected isEqual(other: ValueObject<string>): boolean {
    return this.getValue() === other.getValue();
  }
}
