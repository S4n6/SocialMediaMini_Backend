import { SelfFollowException } from '../follow.exceptions';
import {
  UserFollowedEvent,
  UserUnfollowedEvent,
} from '../events/follow.events';

export interface FollowEntityProps {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

/**
 * Follow Domain Entity
 * Represents a follow relationship between two users
 */
export class FollowEntity {
  private readonly props: FollowEntityProps;
  private _domainEvents: Array<UserFollowedEvent | UserUnfollowedEvent> = [];

  private constructor(props: FollowEntityProps) {
    this.validate(props);
    this.props = props;
  }

  /**
   * Reconstruct from persistence
   */
  static create(props: FollowEntityProps): FollowEntity {
    return new FollowEntity(props);
  }

  /**
   * Create a new follow relationship (factory method)
   */
  static createNew(followerId: string, followingId: string): FollowEntity {
    if (followerId === followingId) {
      throw new SelfFollowException();
    }

    const entity = new FollowEntity({
      id: '', // Will be assigned by repository
      followerId,
      followingId,
      createdAt: new Date(),
    });

    return entity;
  }

  private validate(props: FollowEntityProps): void {
    if (!props.followerId) {
      throw new Error('Follower ID is required');
    }
    if (!props.followingId) {
      throw new Error('Following ID is required');
    }
    if (props.followerId === props.followingId) {
      throw new SelfFollowException();
    }
  }

  // --- Domain Events ---

  get domainEvents(): ReadonlyArray<UserFollowedEvent | UserUnfollowedEvent> {
    return this._domainEvents;
  }

  addDomainEvent(event: UserFollowedEvent | UserUnfollowedEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get followerId(): string {
    return this.props.followerId;
  }

  get followingId(): string {
    return this.props.followingId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  // --- Business Methods ---

  isFollowerOf(userId: string): boolean {
    return this.props.followerId === userId;
  }

  isFollowingUser(userId: string): boolean {
    return this.props.followingId === userId;
  }

  involves(userId: string): boolean {
    return (
      this.props.followerId === userId || this.props.followingId === userId
    );
  }

  toPlainObject(): FollowEntityProps {
    return { ...this.props };
  }
}
