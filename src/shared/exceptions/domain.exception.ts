/**
 * Base class for all domain exceptions
 * Domain exceptions represent violations of business rules
 */
export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Get error details for logging
   */
  public getDetails(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      stack: this.stack,
    };
  }
}

/**
 * Exception thrown when business rule is violated
 */
export class BusinessRuleException extends DomainException {
  constructor(message: string, code: string = 'BUSINESS_RULE_VIOLATION') {
    super(message, code, 400);
  }
}

/**
 * Exception thrown when entity is not found
 */
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, identifier: string | number) {
    super(
      `${entityName} with identifier '${identifier}' not found`,
      'ENTITY_NOT_FOUND',
      404,
    );
  }
}

/**
 * Exception thrown when entity already exists
 */
export class EntityAlreadyExistsException extends DomainException {
  constructor(entityName: string, identifier: string | number) {
    super(
      `${entityName} with identifier '${identifier}' already exists`,
      'ENTITY_ALREADY_EXISTS',
      409,
    );
  }
}

/**
 * Exception thrown when validation fails
 */
export class ValidationException extends DomainException {
  public readonly validationErrors: Record<string, string[]>;

  constructor(
    message: string,
    validationErrors: Record<string, string[]> = {},
    code: string = 'VALIDATION_FAILED',
  ) {
    super(message, code, 422);
    this.validationErrors = validationErrors;
  }

  public getDetails(): Record<string, any> {
    return {
      ...super.getDetails(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * Exception thrown when unauthorized action is attempted
 */
export class UnauthorizedException extends DomainException {
  constructor(
    message: string = 'Unauthorized action',
    code: string = 'UNAUTHORIZED',
  ) {
    super(message, code, 401);
  }
}

/**
 * Exception thrown when forbidden action is attempted
 */
export class ForbiddenException extends DomainException {
  constructor(
    message: string = 'Forbidden action',
    code: string = 'FORBIDDEN',
  ) {
    super(message, code, 403);
  }
}
