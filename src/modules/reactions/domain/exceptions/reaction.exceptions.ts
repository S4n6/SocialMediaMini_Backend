/**
 * Base class for all reaction domain exceptions
 * Pure TypeScript - no framework dependencies
 */
export class ReactionDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ReactionNotFoundException extends ReactionDomainException {
  constructor(reactionId?: string) {
    const message = reactionId
      ? `Reaction with ID '${reactionId}' not found`
      : 'Reaction not found';
    super(message);
  }
}

export class InvalidReactionTargetException extends ReactionDomainException {
  constructor() {
    super('Either postId or commentId is required, but not both');
  }
}

export class PostNotFoundException extends ReactionDomainException {
  constructor(postId: string) {
    super(`Post with ID '${postId}' not found`);
  }
}

export class CommentNotFoundException extends ReactionDomainException {
  constructor(commentId: string) {
    super(`Comment with ID '${commentId}' not found`);
  }
}

export class UnauthorizedReactionException extends ReactionDomainException {
  constructor() {
    super('You can only modify or delete your own reactions');
  }
}

export class InvalidReactionTypeException extends ReactionDomainException {
  constructor(type: string) {
    super(
      `Invalid reaction type: '${type}'. Allowed types are: LIKE, LOVE, HAHA, WOW, SAD, ANGRY`,
    );
  }
}
