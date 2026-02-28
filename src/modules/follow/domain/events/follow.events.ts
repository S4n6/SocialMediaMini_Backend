/**
 * Follow Domain Events
 * Events emitted when significant state changes occur in the follow domain
 */

/**
 * Base Follow Domain Event
 */
export abstract class FollowDomainEvent {
  public readonly occurredAt: Date;

  constructor(public readonly eventName: string) {
    this.occurredAt = new Date();
  }
}

/**
 * User Followed Event
 * Emitted when a user follows another user
 */
export class UserFollowedEvent extends FollowDomainEvent {
  constructor(
    public readonly followId: string,
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly followerUserName: string,
    public readonly followingUserName: string,
  ) {
    super('follow.user.followed');
  }
}

/**
 * User Unfollowed Event
 * Emitted when a user unfollows another user
 */
export class UserUnfollowedEvent extends FollowDomainEvent {
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
  ) {
    super('follow.user.unfollowed');
  }
}
