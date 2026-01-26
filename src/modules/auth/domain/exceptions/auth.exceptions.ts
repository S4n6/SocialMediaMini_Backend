/**
 * Base Domain Exception
 */
export abstract class AuthDomainException extends Error {
  abstract readonly code: string;

  constructor(
    message: string,
    public readonly details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * User Domain Exceptions
 */
export class UserNotFoundException extends AuthDomainException {
  readonly code = 'USER_NOT_FOUND';

  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
  }
}

export class UserAlreadyExistsException extends AuthDomainException {
  readonly code = 'USER_ALREADY_EXISTS';

  constructor(email: string) {
    super(`User with email ${email} already exists`);
  }
}

export class InvalidPasswordException extends AuthDomainException {
  readonly code = 'INVALID_PASSWORD';

  constructor() {
    super('Invalid password provided');
  }
}

export class UserNotVerifiedException extends AuthDomainException {
  readonly code = 'USER_NOT_VERIFIED';

  constructor() {
    super('User email is not verified');
  }
}

/**
 * Session Domain Exceptions
 */
export class SessionNotFoundException extends AuthDomainException {
  readonly code = 'SESSION_NOT_FOUND';

  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
  }
}

export class SessionExpiredException extends AuthDomainException {
  readonly code = 'SESSION_EXPIRED';

  constructor() {
    super('Session has expired');
  }
}

export class SessionRevokedException extends AuthDomainException {
  readonly code = 'SESSION_REVOKED';

  constructor() {
    super('Session has been revoked');
  }
}

export class MaxSessionsExceededException extends AuthDomainException {
  readonly code = 'MAX_SESSIONS_EXCEEDED';

  constructor(maxSessions: number) {
    super(`Maximum number of sessions exceeded: ${maxSessions}`);
  }
}

/**
 * Token Domain Exceptions
 */
export class InvalidTokenException extends AuthDomainException {
  readonly code = 'INVALID_TOKEN';

  constructor(tokenType: string) {
    super(`Invalid ${tokenType} token`);
  }
}

export class TokenExpiredException extends AuthDomainException {
  readonly code = 'TOKEN_EXPIRED';

  constructor(tokenType: string) {
    super(`${tokenType} token has expired`);
  }
}

export class TokenRevokedException extends AuthDomainException {
  readonly code = 'TOKEN_REVOKED';

  constructor(tokenType: string) {
    super(`${tokenType} token has been revoked`);
  }
}
