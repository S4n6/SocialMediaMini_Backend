import { DomainEvent } from '../../../shared/domain/domain-event.base';
import { UserProfile } from './user-profile.value-object';

/**
 * Event raised when a new user is registered
 */
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly profile: UserProfile,
  ) {
    super();
  }

  get eventType(): string {
    return 'user.registered';
  }

  protected getEventData(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      username: this.username,
      profile: {
        fullName: this.profile.fullName,
        bio: this.profile.bio,
        avatar: this.profile.avatar,
      },
    };
  }
}

/**
 * Event raised when a user follows another user
 */
export class UserFollowedEvent extends DomainEvent {
  constructor(
    public readonly followerId: string,
    public readonly followeeId: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'user.followed';
  }

  protected getEventData(): Record<string, any> {
    return {
      followerId: this.followerId,
      followeeId: this.followeeId,
    };
  }
}

/**
 * Event raised when a user unfollows another user
 */
export class UserUnfollowedEvent extends DomainEvent {
  constructor(
    public readonly followerId: string,
    public readonly followeeId: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'user.unfollowed';
  }

  protected getEventData(): Record<string, any> {
    return {
      followerId: this.followerId,
      followeeId: this.followeeId,
    };
  }
}

/**
 * Event raised when user profile is updated
 */
export class UserProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly oldProfile: UserProfile,
    public readonly newProfile: UserProfile,
  ) {
    super();
  }

  get eventType(): string {
    return 'user.profile.updated';
  }

  protected getEventData(): Record<string, any> {
    return {
      userId: this.userId,
      changes: this.getProfileChanges(),
      newProfile: {
        fullName: this.newProfile.fullName,
        bio: this.newProfile.bio,
        avatar: this.newProfile.avatar,
        location: this.newProfile.location,
      },
    };
  }

  private getProfileChanges(): Record<string, any> {
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
export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly verifiedAt: Date,
  ) {
    super();
  }

  get eventType(): string {
    return 'user.email.verified';
  }

  protected getEventData(): Record<string, any> {
    return {
      userId: this.userId,
      email: this.email,
      verifiedAt: this.verifiedAt.toISOString(),
    };
  }
}
