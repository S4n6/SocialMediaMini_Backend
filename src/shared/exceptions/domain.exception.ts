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

/**
 * Exception thrown when external service fails
 */
export class ExternalServiceException extends DomainException {
  public readonly service: string;
  public readonly operation?: string;

  constructor(
    service: string,
    message: string,
    operation?: string,
    code: string = 'EXTERNAL_SERVICE_ERROR',
  ) {
    super(message, code, 502);
    this.service = service;
    this.operation = operation;
  }

  public getDetails(): Record<string, any> {
    return {
      ...super.getDetails(),
      service: this.service,
      operation: this.operation,
    };
  }
}

/**
 * Exception thrown when database operation fails
 */
export class DatabaseException extends DomainException {
  public readonly operation: string;
  public readonly table?: string;

  constructor(
    operation: string,
    message: string,
    table?: string,
    code: string = 'DATABASE_ERROR',
  ) {
    super(message, code, 500);
    this.operation = operation;
    this.table = table;
  }

  public getDetails(): Record<string, any> {
    return {
      ...super.getDetails(),
      operation: this.operation,
      table: this.table,
    };
  }
}

/**
 * Exception thrown when rate limit is exceeded
 */
export class RateLimitException extends DomainException {
  public readonly limit: number;
  public readonly windowMs: number;
  public readonly resetTime?: Date;

  constructor(
    limit: number,
    windowMs: number,
    resetTime?: Date,
    message: string = 'Rate limit exceeded',
    code: string = 'RATE_LIMIT_EXCEEDED',
  ) {
    super(message, code, 429);
    this.limit = limit;
    this.windowMs = windowMs;
    this.resetTime = resetTime;
  }

  public getDetails(): Record<string, any> {
    return {
      ...super.getDetails(),
      limit: this.limit,
      windowMs: this.windowMs,
      resetTime: this.resetTime?.toISOString(),
    };
  }
}

/**
 * Exception thrown when configuration is invalid
 */
export class ConfigurationException extends DomainException {
  public readonly configKey: string;

  constructor(
    configKey: string,
    message: string,
    code: string = 'CONFIGURATION_ERROR',
  ) {
    super(message, code, 500);
    this.configKey = configKey;
  }

  public getDetails(): Record<string, any> {
    return {
      ...super.getDetails(),
      configKey: this.configKey,
    };
  }
}

/**
 * Exception thrown when file operation fails
 */
export class FileOperationException extends DomainException {
  public readonly operation: string;
  public readonly fileName?: string;
  public readonly fileSize?: number;

  constructor(
    operation: string,
    message: string,
    fileName?: string,
    fileSize?: number,
    code: string = 'FILE_OPERATION_ERROR',
  ) {
    super(message, code, 400);
    this.operation = operation;
    this.fileName = fileName;
    this.fileSize = fileSize;
  }

  public getDetails(): Record<string, any> {
    return {
      ...super.getDetails(),
      operation: this.operation,
      fileName: this.fileName,
      fileSize: this.fileSize,
    };
  }
}
