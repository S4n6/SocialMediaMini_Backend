import { IDomainEvent } from '../entities/entity.base';
import { UserProfile } from '../value-objects/user-profile.value-object';

/**
 * Event raised when a new user is registered
 */
export class UserRegisteredEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly eventName: string;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly profile: UserProfile,
  ) {
    this.aggregateId = userId;
    this.occurredOn = new Date();
    this.eventName = 'user.registered';
  }
}

/**
 * Event raised when a user follows another user
 */
export class UserFollowedEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly eventName: string;

  constructor(
    public readonly followerId: string,
    public readonly followeeId: string,
  ) {
    this.aggregateId = followerId;
    this.occurredOn = new Date();
    this.eventName = 'user.followed';
  }
}

/**
 * Event raised when a user unfollows another user
 */
export class UserUnfollowedEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly eventName: string;

  constructor(
    public readonly followerId: string,
    public readonly followeeId: string,
  ) {
    this.aggregateId = followerId;
    this.occurredOn = new Date();
    this.eventName = 'user.unfollowed';
  }
}

/**
 * Event raised when user profile is updated
 */
export class UserProfileUpdatedEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly eventName: string;

  constructor(
    public readonly userId: string,
    public readonly oldProfile: UserProfile,
    public readonly newProfile: UserProfile,
  ) {
    this.aggregateId = userId;
    this.occurredOn = new Date();
    this.eventName = 'user.profile.updated';
  }

  public getProfileChanges(): Record<string, any> {
    const changes: Record<string, any> = {};

    if (this.oldProfile.fullName !== this.newProfile.fullName) {
      changes.fullName = {
        old: this.oldProfile.fullName,
        new: this.newProfile.fullName,
      };
    }

    if (this.oldProfile.bio !== this.newProfile.bio) {
      changes.bio = {
        old: this.oldProfile.bio,
        new: this.newProfile.bio,
      };
    }

    if (this.oldProfile.avatar !== this.newProfile.avatar) {
      changes.avatar = {
        old: this.oldProfile.avatar,
        new: this.newProfile.avatar,
      };
    }

    return changes;
  }
}

/**
 * Event raised when user email is verified
 */
export class UserEmailVerifiedEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly eventName: string;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly verifiedAt: Date,
  ) {
    this.aggregateId = userId;
    this.occurredOn = new Date();
    this.eventName = 'user.email.verified';
  }
}
