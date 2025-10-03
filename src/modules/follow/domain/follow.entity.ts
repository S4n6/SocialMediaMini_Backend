export interface FollowEntityProps {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FollowEntity {
  private constructor(private readonly props: FollowEntityProps) {
    this.validateFollow();
  }

  static create(props: FollowEntityProps): FollowEntity {
    return new FollowEntity(props);
  }

  static createNew(followerId: string, followingId: string): FollowEntity {
    const now = new Date();

    return new FollowEntity({
      id: '', // Will be set by repository
      followerId,
      followingId,
      createdAt: now,
      updatedAt: now,
    });
  }

  private validateFollow(): void {
    if (!this.props.followerId) {
      throw new Error('Follower ID is required');
    }

    if (!this.props.followingId) {
      throw new Error('Following ID is required');
    }

    if (this.props.followerId === this.props.followingId) {
      throw new Error('Cannot follow yourself');
    }
  }

  // Getters
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

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Methods
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
