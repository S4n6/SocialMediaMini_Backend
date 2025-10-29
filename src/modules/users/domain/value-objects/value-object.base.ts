/**
 * Base Value Object class for Domain Layer
 * Pure domain - no infrastructure dependencies
 */
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this.validateInvariants(value);
    this._value = value;
  }

  /**
   * Get the value
   */
  public getValue(): T {
    return this._value;
  }

  /**
   * Abstract method for value validation
   */
  protected abstract validateInvariants(value: T): void;

  /**
   * Abstract method for equality comparison
   */
  protected abstract isEqual(other: ValueObject<T>): boolean;

  /**
   * Value object equality
   */
  public equals(other: ValueObject<T>): boolean {
    if (!other) {
      return false;
    }

    return this.isEqual(other);
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    return String(this._value);
  }
}
