import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

export class ReactionNotFoundException extends NotFoundException {
  constructor(reactionId?: string) {
    const message = reactionId
      ? `Reaction with ID '${reactionId}' not found`
      : 'Reaction not found';
    super(message);
  }
}

export class InvalidReactionTargetException extends BadRequestException {
  constructor() {
    super('Either postId or commentId is required, but not both');
  }
}

export class PostNotFoundException extends NotFoundException {
  constructor(postId: string) {
    super(`Post with ID '${postId}' not found`);
  }
}

export class CommentNotFoundException extends NotFoundException {
  constructor(commentId: string) {
    super(`Comment with ID '${commentId}' not found`);
  }
}

export class UnauthorizedReactionException extends ForbiddenException {
  constructor() {
    super('You can only modify or delete your own reactions');
  }
}

export class InvalidReactionTypeException extends BadRequestException {
  constructor(type: string) {
    super(
      `Invalid reaction type: '${type}'. Allowed types are: LIKE, LOVE, HAHA, WOW, SAD, ANGRY`,
    );
  }
}
