import { DomainException } from './domain.exceptions';

/**
 * Base Business Rule Exception for User domain
 */
export class BusinessRuleException extends DomainException {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

/**
 * Entity Already Exists Exception for User domain
 */
export class EntityAlreadyExistsException extends DomainException {
  constructor(entityType: string, identifier: string) {
    super(`${entityType} with identifier '${identifier}' already exists`);
  }
}

/**
 * Exception thrown when username is already taken
 */
export class UsernameAlreadyExistsException extends EntityAlreadyExistsException {
  constructor(username: string) {
    super('User', username);
  }
}

/**
 * Exception thrown when email is already registered
 */
export class EmailAlreadyExistsException extends EntityAlreadyExistsException {
  constructor(email: string) {
    super('User email', email);
  }
}

/**
 * Exception thrown when user account is not active
 */
export class UserAccountInactiveException extends BusinessRuleException {
  constructor() {
    super('User account is inactive', 'USER_ACCOUNT_INACTIVE');
  }
}

/**
 * Exception thrown when user email is not verified for actions requiring verification
 */
export class EmailNotVerifiedException extends BusinessRuleException {
  constructor() {
    super(
      'Email must be verified to perform this action',
      'EMAIL_NOT_VERIFIED',
    );
  }
}

/**
 * Exception thrown when user tries to update profile too frequently
 */
export class ProfileUpdateTooFrequentException extends BusinessRuleException {
  constructor(nextAllowedUpdate: Date) {
    super(
      `Profile can be updated again after ${nextAllowedUpdate.toISOString()}`,
      'PROFILE_UPDATE_TOO_FREQUENT',
    );
  }
}

/**
 * Exception thrown when user is not found
 */
export class UserNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`User with identifier '${identifier}' not found`);
  }
}
