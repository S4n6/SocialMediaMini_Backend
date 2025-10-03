export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';

export interface ReactionEntityProps {
  id: string;
  type: ReactionType;
  reactorId: string;
  postId?: string | null;
  commentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ReactionEntity {
  private constructor(private readonly props: ReactionEntityProps) {
    this.validateReaction();
  }

  static create(props: ReactionEntityProps): ReactionEntity {
    return new ReactionEntity(props);
  }

  static createNew(
    type: ReactionType,
    reactorId: string,
    targetId: string,
    targetType: 'post' | 'comment',
  ): ReactionEntity {
    const now = new Date();

    return new ReactionEntity({
      id: '', // Will be set by repository
      type,
      reactorId,
      postId: targetType === 'post' ? targetId : null,
      commentId: targetType === 'comment' ? targetId : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  private validateReaction(): void {
    if (!this.props.reactorId) {
      throw new Error('Reactor ID is required');
    }

    if (!this.props.postId && !this.props.commentId) {
      throw new Error('Either postId or commentId must be provided');
    }

    if (this.props.postId && this.props.commentId) {
      throw new Error('Cannot react to both post and comment simultaneously');
    }

    const validTypes: ReactionType[] = [
      'LIKE',
      'LOVE',
      'HAHA',
      'WOW',
      'SAD',
      'ANGRY',
    ];
    if (!validTypes.includes(this.props.type)) {
      throw new Error(`Invalid reaction type: ${this.props.type}`);
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get type(): ReactionType {
    return this.props.type;
  }

  get reactorId(): string {
    return this.props.reactorId;
  }

  get postId(): string | null {
    return this.props.postId || null;
  }

  get commentId(): string | null {
    return this.props.commentId || null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get targetType(): 'post' | 'comment' {
    return this.props.postId ? 'post' : 'comment';
  }

  get targetId(): string {
    return (this.props.postId || this.props.commentId)!;
  }

  // Methods
  updateType(newType: ReactionType): void {
    this.props.type = newType;
    this.props.updatedAt = new Date();
  }

  isOwnedBy(userId: string): boolean {
    return this.props.reactorId === userId;
  }

  isReactionTo(targetId: string, targetType: 'post' | 'comment'): boolean {
    if (targetType === 'post') {
      return this.props.postId === targetId;
    }
    return this.props.commentId === targetId;
  }

  toPlainObject(): ReactionEntityProps {
    return { ...this.props };
  }
}
