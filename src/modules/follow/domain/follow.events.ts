import { FollowEntity } from './follow.entity';

export abstract class FollowDomainEvent {
  abstract readonly eventName: string;
  readonly occurredOn: Date;

  constructor(public readonly follow: FollowEntity) {
    this.occurredOn = new Date();
  }
}

export class UserFollowedEvent extends FollowDomainEvent {
  readonly eventName = 'user.followed';

  constructor(
    follow: FollowEntity,
    public readonly followerUserName: string,
    public readonly followingUserName: string,
  ) {
    super(follow);
  }
}

export class UserUnfollowedEvent extends FollowDomainEvent {
  readonly eventName = 'user.unfollowed';

  constructor(
    follow: FollowEntity,
    public readonly followerUserName: string,
    public readonly followingUserName: string,
  ) {
    super(follow);
  }
}
