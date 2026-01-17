/**
 * Base Domain Event
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;

  constructor() {
    this.occurredOn = new Date();
  }

  abstract eventName(): string;
}

/**
 * User Registered Event
 * Emitted when a new user successfully registers
 */
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly fullName: string,
  ) {
    super();
  }

  eventName(): string {
    return 'user.registered';
  }
}

/**
 * User Email Verified Event
 * Emitted when a user verifies their email address
 */
export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super();
  }

  eventName(): string {
    return 'user.email_verified';
  }
}

/**
 * User Logged In Event
 * Emitted when a user successfully logs in
 */
export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super();
  }

  eventName(): string {
    return 'user.logged_in';
  }
}

/**
 * User Logged Out Event
 * Emitted when a user logs out
 */
export class UserLoggedOutEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
  ) {
    super();
  }

  eventName(): string {
    return 'user.logged_out';
  }
}

/**
 * Password Reset Requested Event
 * Emitted when a user requests a password reset
 */
export class PasswordResetRequestedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super();
  }

  eventName(): string {
    return 'password.reset_requested';
  }
}

/**
 * Password Changed Event
 * Emitted when a user successfully changes their password
 */
export class PasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super();
  }

  eventName(): string {
    return 'password.changed';
  }
}

/**
 * Verification Email Sent Event
 * Emitted when a verification email is sent
 */
export class VerificationEmailSentEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super();
  }

  eventName(): string {
    return 'verification_email.sent';
  }
}
