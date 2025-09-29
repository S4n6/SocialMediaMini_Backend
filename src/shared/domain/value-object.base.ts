/**
 * Base class for Value Objects
 * Value objects are immutable objects that represent a concept from the domain
 * They are defined by their attributes rather than an identity
 */
export abstract class ValueObject<T> {
  protected readonly value: T;

  constructor(value: T) {
    this.validateInvariants(value);
    this.value = Object.freeze(value);
  }

  /**
   * Get the underlying value
   */
  public getValue(): T {
    return this.value;
  }

  /**
   * Check if two value objects are equal
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    if (vo.constructor.name !== this.constructor.name) {
      return false;
    }

    return this.isEqual(vo);
  }

  /**
   * Override this method to implement equality logic
   */
  protected abstract isEqual(vo: ValueObject<T>): boolean;

  /**
   * Override this method to validate business rules
   */
  protected abstract validateInvariants(value: T): void;

  /**
   * Get string representation
   */
  public toString(): string {
    return JSON.stringify(this.value);
  }
}
