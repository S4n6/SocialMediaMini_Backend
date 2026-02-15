/**
 * Auth Domain Events
 * Events emitted when significant state changes occur in the auth domain
 */

/**
 * Base Auth Domain Event
 */
export abstract class AuthDomainEvent {
  public readonly occurredAt: Date;

  constructor(public readonly eventName: string) {
    this.occurredAt = new Date();
  }
}

/**
 * User Logged In Event
 * Emitted when a user successfully logs in
 */
export class UserLoggedInEvent extends AuthDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super('auth.user.logged-in');
  }
}

/**
 * Password Changed Event
 * Emitted when a user changes their password
 */
export class PasswordChangedEvent extends AuthDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super('auth.password.changed');
  }
}

/**
 * Email Verified Event
 * Emitted when a user verifies their email address
 */
export class EmailVerifiedEvent extends AuthDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly verifiedAt: Date,
  ) {
    super('auth.email.verified');
  }
}

/**
 * Session Created Event
 * Emitted when a new session is created
 */
export class SessionCreatedEvent extends AuthDomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    super('auth.session.created');
  }
}

/**
 * Session Revoked Event
 * Emitted when a session is revoked
 */
export class SessionRevokedEvent extends AuthDomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly revokedAt: Date,
  ) {
    super('auth.session.revoked');
  }
}

/**
 * User Registered Event
 * Emitted when a new user registers
 */
export class UserRegisteredEvent extends AuthDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
  ) {
    super('auth.user.registered');
  }
}
