import { Entity } from '../../../shared/domain/entity.base';
import { randomUUID } from 'crypto';
import {
  PostCreatedEvent,
  PostUpdatedEvent,
  PostDeletedEvent,
  PostLikedEvent,
  PostUnlikedEvent,
  PostCommentedEvent,
} from './post.events';
import {
  InvalidPostContentException,
  PostNotFoundException,
  UnauthorizedPostActionException,
  PostAlreadyLikedException,
  PostNotLikedException,
  EmptyPostContentException,
} from './post.exceptions';

// Simple DomainException class for now
class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export enum PostPrivacy {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private',
}

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  ANGRY = 'angry',
  SAD = 'sad',
}

export interface PostMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  order: number;
}

export interface PostReaction {
  id: string;
  type: ReactionType;
  userId: string;
  createdAt: Date;
}

export interface PostComment {
  id: string;
  content: string;
  authorId: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostProps {
  id?: string;
  content?: string;
  privacy: PostPrivacy;
  authorId: string;
  media?: PostMedia[];
  reactions?: PostReaction[];
  comments?: PostComment[];
  hashtags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class PostEntity extends Entity<string> {
  private _content?: string;
  private _privacy: PostPrivacy;
  private _authorId: string;
  private _media: PostMedia[] = [];
  private _reactions: PostReaction[] = [];
  private _comments: PostComment[] = [];
  private _hashtags: string[] = [];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PostProps) {
    super(props.id || randomUUID());
    this._content = props.content;
    this._privacy = props.privacy;
    this._authorId = props.authorId;
    this._media = props.media || [];
    this._reactions = props.reactions || [];
    this._comments = props.comments || [];
    this._hashtags = props.hashtags || [];
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();

    if (!props.id) {
      this.addDomainEvent(
        new PostCreatedEvent(
          this.id,
          this._authorId,
          this._content,
          this._privacy,
        ),
      );
    }
  }

  // Getters
  get content(): string | undefined {
    return this._content;
  }

  get privacy(): PostPrivacy {
    return this._privacy;
  }

  get authorId(): string {
    return this._authorId;
  }

  get media(): PostMedia[] {
    return [...this._media];
  }

  get reactions(): PostReaction[] {
    return [...this._reactions];
  }

  get comments(): PostComment[] {
    return [...this._comments];
  }

  get hashtags(): string[] {
    return [...this._hashtags];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get likesCount(): number {
    return this._reactions.filter((r) => r.type === ReactionType.LIKE).length;
  }

  get commentsCount(): number {
    return this._comments.length;
  }

  // Domain methods
  updateContent(newContent?: string, hashtags?: string[]): void {
    if (
      newContent !== undefined &&
      newContent.trim() === '' &&
      (!this._media || this._media.length === 0)
    ) {
      throw new EmptyPostContentException();
    }

    const oldContent = this._content;
    this._content = newContent;
    this._hashtags = hashtags || this.extractHashtags(newContent);
    this._updatedAt = new Date();

    this.validate();

    this.addDomainEvent(
      new PostUpdatedEvent(this.id, this._authorId, oldContent, newContent),
    );
  }

  changePrivacy(newPrivacy: PostPrivacy): void {
    if (this._privacy !== newPrivacy) {
      this._privacy = newPrivacy;
      this.validate();
    }
  }

  addMedia(media: PostMedia): void {
    const exists = this._media.find((m) => m.id === media.id);
    if (!exists) {
      this._media.push(media);
      this._media.sort((a, b) => a.order - b.order);
    }
  }

  removeMedia(mediaId: string): void {
    this._media = this._media.filter((m) => m.id !== mediaId);
  }

  clearMedia(): void {
    this._media = [];
  }

  addReaction(userId: string, type: ReactionType): void {
    const existingReaction = this._reactions.find((r) => r.userId === userId);

    if (existingReaction) {
      if (existingReaction.type === type) {
        throw new PostAlreadyLikedException();
      }
      // Update existing reaction type
      existingReaction.type = type;
    } else {
      const reaction: PostReaction = {
        id: this.generateId(),
        type,
        userId,
        createdAt: new Date(),
      };
      this._reactions.push(reaction);
    }

    this.addDomainEvent(new PostLikedEvent(this.id, userId, type));
  }

  removeReaction(userId: string): void {
    const reactionIndex = this._reactions.findIndex((r) => r.userId === userId);

    if (reactionIndex === -1) {
      throw new PostNotLikedException();
    }

    const reaction = this._reactions[reactionIndex];
    this._reactions.splice(reactionIndex, 1);

    this.addDomainEvent(new PostUnlikedEvent(this.id, userId, reaction.type));
  }

  addComment(
    commentId: string,
    content: string,
    authorId: string,
    parentId?: string,
  ): void {
    const comment: PostComment = {
      id: commentId,
      content,
      authorId,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this._comments.push(comment);

    this.addDomainEvent(
      new PostCommentedEvent(this.id, commentId, authorId, content),
    );
  }

  removeComment(commentId: string): void {
    this._comments = this._comments.filter((c) => c.id !== commentId);
  }

  updateComment(commentId: string, content: string): void {
    const comment = this._comments.find((c) => c.id === commentId);
    if (comment) {
      comment.content = content;
      comment.updatedAt = new Date();
      this._updatedAt = new Date();
    }
  }

  canBeViewedBy(viewerId: string): boolean {
    switch (this._privacy) {
      case PostPrivacy.PUBLIC:
        return true;
      case PostPrivacy.PRIVATE:
        return this._authorId === viewerId;
      case PostPrivacy.FOLLOWERS:
        // This would need to check if viewer follows author
        // For now, just check if viewer is author
        return this._authorId === viewerId;
      default:
        return false;
    }
  }

  canBeEditedBy(userId: string): boolean {
    return this._authorId === userId;
  }

  canBeDeletedBy(userId: string): boolean {
    return this._authorId === userId;
  }

  delete(): void {
    this.addDomainEvent(new PostDeletedEvent(this.id, this._authorId));
  }

  private validate(): void {
    if (!this._authorId) {
      throw new InvalidPostContentException('Author ID is required');
    }

    if (!this._content && (!this._media || this._media.length === 0)) {
      throw new EmptyPostContentException();
    }

    if (this._content && this._content.length > 2000) {
      throw new InvalidPostContentException(
        'Post content exceeds maximum length',
      );
    }

    if (!Object.values(PostPrivacy).includes(this._privacy)) {
      throw new InvalidPostContentException('Invalid privacy setting');
    }
  }

  private extractHashtags(content?: string): string[] {
    if (!content) return [];

    const hashtags = content.match(/#\w+/g) || [];
    return hashtags.map((tag) => tag.toLowerCase());
  }

  private generateId(): string {
    return randomUUID();
  }

  // Static factory methods
  static createNew(
    props: Omit<PostProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): PostEntity {
    return new PostEntity(props);
  }

  static fromPersistence(props: PostProps): PostEntity {
    return new PostEntity(props);
  }

  // Convert to persistence format
  toPersistence() {
    return {
      id: this.id,
      content: this._content,
      privacy: this._privacy,
      authorId: this._authorId,
      media: this._media,
      reactions: this._reactions,
      comments: this._comments,
      hashtags: this._hashtags,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
