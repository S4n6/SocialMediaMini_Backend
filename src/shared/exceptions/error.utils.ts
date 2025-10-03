import {
  ValidationException,
  BusinessRuleException,
  EntityNotFoundException,
  EntityAlreadyExistsException,
  UnauthorizedException,
  ForbiddenException,
  DatabaseException,
  ExternalServiceException,
  FileOperationException,
  RateLimitException,
  ConfigurationException,
} from './domain.exception';

/**
 * Utility class for creating domain exceptions with proper context
 * This provides a fluent interface for exception creation
 */
export class ErrorFactory {
  /**
   * Create a validation exception
   */
  static validation(
    message: string,
    errors: Record<string, string[]> = {},
  ): ValidationException {
    return new ValidationException(message, errors);
  }

  /**
   * Create a business rule exception
   */
  static businessRule(message: string, code?: string): BusinessRuleException {
    return new BusinessRuleException(message, code);
  }

  /**
   * Create an entity not found exception
   */
  static entityNotFound(
    entityName: string,
    identifier: string | number,
  ): EntityNotFoundException {
    return new EntityNotFoundException(entityName, identifier);
  }

  /**
   * Create an entity already exists exception
   */
  static entityAlreadyExists(
    entityName: string,
    identifier: string | number,
  ): EntityAlreadyExistsException {
    return new EntityAlreadyExistsException(entityName, identifier);
  }

  /**
   * Create an unauthorized exception
   */
  static unauthorized(message?: string, code?: string): UnauthorizedException {
    return new UnauthorizedException(message, code);
  }

  /**
   * Create a forbidden exception
   */
  static forbidden(message?: string, code?: string): ForbiddenException {
    return new ForbiddenException(message, code);
  }

  /**
   * Create a database exception
   */
  static database(
    operation: string,
    message: string,
    table?: string,
    code?: string,
  ): DatabaseException {
    return new DatabaseException(operation, message, table, code);
  }

  /**
   * Create an external service exception
   */
  static externalService(
    service: string,
    message: string,
    operation?: string,
    code?: string,
  ): ExternalServiceException {
    return new ExternalServiceException(service, message, operation, code);
  }

  /**
   * Create a file operation exception
   */
  static fileOperation(
    operation: string,
    message: string,
    fileName?: string,
    fileSize?: number,
    code?: string,
  ): FileOperationException {
    return new FileOperationException(
      operation,
      message,
      fileName,
      fileSize,
      code,
    );
  }

  /**
   * Create a rate limit exception
   */
  static rateLimit(
    limit: number,
    windowMs: number,
    resetTime?: Date,
    message?: string,
    code?: string,
  ): RateLimitException {
    return new RateLimitException(limit, windowMs, resetTime, message, code);
  }

  /**
   * Create a configuration exception
   */
  static configuration(
    configKey: string,
    message: string,
    code?: string,
  ): ConfigurationException {
    return new ConfigurationException(configKey, message, code);
  }
}

/**
 * Utility class for common error scenarios in domain services
 */
export class DomainErrors {
  /**
   * User not found error
   */
  static userNotFound(userId: string): EntityNotFoundException {
    return ErrorFactory.entityNotFound('User', userId);
  }

  /**
   * Post not found error
   */
  static postNotFound(postId: string): EntityNotFoundException {
    return ErrorFactory.entityNotFound('Post', postId);
  }

  /**
   * Comment not found error
   */
  static commentNotFound(commentId: string): EntityNotFoundException {
    return ErrorFactory.entityNotFound('Comment', commentId);
  }

  /**
   * User already exists error
   */
  static userAlreadyExists(email: string): EntityAlreadyExistsException {
    return ErrorFactory.entityAlreadyExists('User', email);
  }

  /**
   * Invalid credentials error
   */
  static invalidCredentials(): UnauthorizedException {
    return ErrorFactory.unauthorized(
      'Invalid credentials',
      'INVALID_CREDENTIALS',
    );
  }

  /**
   * Access token expired error
   */
  static accessTokenExpired(): UnauthorizedException {
    return ErrorFactory.unauthorized(
      'Access token has expired',
      'ACCESS_TOKEN_EXPIRED',
    );
  }

  /**
   * Insufficient permissions error
   */
  static insufficientPermissions(action: string): ForbiddenException {
    return ErrorFactory.forbidden(
      `You don't have permission to ${action}`,
      'INSUFFICIENT_PERMISSIONS',
    );
  }

  /**
   * Invalid file type error
   */
  static invalidFileType(allowedTypes: string[]): FileOperationException {
    return ErrorFactory.fileOperation(
      'upload',
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      undefined,
      undefined,
      'INVALID_FILE_TYPE',
    );
  }

  /**
   * File too large error
   */
  static fileTooLarge(
    maxSize: number,
    actualSize: number,
    fileName?: string,
  ): FileOperationException {
    return ErrorFactory.fileOperation(
      'upload',
      `File is too large. Maximum size: ${maxSize} bytes, actual size: ${actualSize} bytes`,
      fileName,
      actualSize,
      'FILE_TOO_LARGE',
    );
  }

  /**
   * External service unavailable error
   */
  static externalServiceUnavailable(
    serviceName: string,
  ): ExternalServiceException {
    return ErrorFactory.externalService(
      serviceName,
      `${serviceName} service is currently unavailable`,
      'connection',
      'SERVICE_UNAVAILABLE',
    );
  }

  /**
   * Rate limit exceeded error
   */
  static rateLimitExceeded(
    limit: number,
    windowMs: number,
  ): RateLimitException {
    const resetTime = new Date(Date.now() + windowMs);
    return ErrorFactory.rateLimit(
      limit,
      windowMs,
      resetTime,
      `Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 1000} seconds`,
    );
  }

  /**
   * Content validation errors
   */
  static contentTooLong(field: string, maxLength: number): ValidationException {
    return ErrorFactory.validation(`${field} is too long`, {
      [field]: [`Maximum length is ${maxLength} characters`],
    });
  }

  static contentEmpty(field: string): ValidationException {
    return ErrorFactory.validation(`${field} cannot be empty`, {
      [field]: ['This field is required'],
    });
  }

  static invalidFormat(field: string, format: string): ValidationException {
    return ErrorFactory.validation(`Invalid ${field} format`, {
      [field]: [`Must be a valid ${format}`],
    });
  }

  /**
   * Business rule violations
   */
  static cannotPerformAction(
    action: string,
    reason: string,
  ): BusinessRuleException {
    return ErrorFactory.businessRule(
      `Cannot ${action}: ${reason}`,
      'ACTION_NOT_ALLOWED',
    );
  }

  static resourceInUse(
    resourceType: string,
    resourceId: string,
  ): BusinessRuleException {
    return ErrorFactory.businessRule(
      `${resourceType} ${resourceId} is currently in use and cannot be modified`,
      'RESOURCE_IN_USE',
    );
  }

  static dependencyNotMet(dependency: string): BusinessRuleException {
    return ErrorFactory.businessRule(
      `Required dependency not met: ${dependency}`,
      'DEPENDENCY_NOT_MET',
    );
  }
}

/**
 * Utility functions for error handling in application services
 */
export class ErrorUtils {
  /**
   * Assert that a condition is true, throw exception if false
   */
  static assert(condition: boolean, exception: Error): void {
    if (!condition) {
      throw exception;
    }
  }

  /**
   * Assert that a value is not null or undefined
   */
  static assertExists<T>(value: T | null | undefined, exception: Error): T {
    if (value == null) {
      throw exception;
    }
    return value;
  }

  /**
   * Handle async operations with proper error context
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    errorContext: { operation: string; resource?: string },
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw domain exceptions as-is
        if (error.name.includes('Exception')) {
          throw error;
        }

        // Wrap unknown errors as database exceptions
        throw ErrorFactory.database(
          errorContext.operation,
          `Failed to ${errorContext.operation}${errorContext.resource ? ` ${errorContext.resource}` : ''}: ${error.message}`,
        );
      }

      throw ErrorFactory.database(
        errorContext.operation,
        `Unknown error during ${errorContext.operation}`,
      );
    }
  }

  /**
   * Safely parse JSON with error handling
   */
  static safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json);
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Validate array length
   */
  static validateArrayLength(
    array: any[],
    minLength: number,
    maxLength: number,
    fieldName: string,
  ): void {
    if (array.length < minLength) {
      throw ErrorFactory.validation(
        `${fieldName} must have at least ${minLength} items`,
        { [fieldName]: [`Minimum ${minLength} items required`] },
      );
    }

    if (array.length > maxLength) {
      throw ErrorFactory.validation(
        `${fieldName} can have at most ${maxLength} items`,
        { [fieldName]: [`Maximum ${maxLength} items allowed`] },
      );
    }
  }

  /**
   * Validate string length
   */
  static validateStringLength(
    value: string,
    minLength: number,
    maxLength: number,
    fieldName: string,
  ): void {
    if (value.length < minLength) {
      throw ErrorFactory.validation(`${fieldName} is too short`, {
        [fieldName]: [`Minimum length is ${minLength} characters`],
      });
    }

    if (value.length > maxLength) {
      throw ErrorFactory.validation(`${fieldName} is too long`, {
        [fieldName]: [`Maximum length is ${maxLength} characters`],
      });
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw DomainErrors.invalidFormat('email', 'email address');
    }
  }

  /**
   * Validate URL format
   */
  static validateUrl(url: string, fieldName: string = 'url'): void {
    try {
      new URL(url);
    } catch {
      throw DomainErrors.invalidFormat(fieldName, 'URL');
    }
  }
}
