/**
 * Base Domain Exception
 */
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Validation Exception for domain invariants
 */
export class ValidationException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
