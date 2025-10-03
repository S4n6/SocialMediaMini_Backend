import { DomainException } from '../../../shared/exceptions/domain.exception';

export class CommentNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(
      `Comment with identifier '${identifier}' not found`,
      'COMMENT_NOT_FOUND',
      404,
    );
  }
}

export class InvalidCommentException extends DomainException {
  constructor(message: string = 'Invalid comment data') {
    super(message, 'INVALID_COMMENT', 400);
  }
}

export class UnauthorizedCommentActionException extends DomainException {
  constructor(action: string = 'perform this action') {
    super(
      `You are not authorized to ${action} on this comment`,
      'UNAUTHORIZED_COMMENT_ACTION',
      403,
    );
  }
}

export class InvalidParentCommentException extends DomainException {
  constructor(message: string = 'Invalid parent comment') {
    super(message, 'INVALID_PARENT_COMMENT', 400);
  }
}

export class CommentDepthLimitException extends DomainException {
  constructor(maxDepth: number) {
    super(
      `Comment thread depth cannot exceed ${maxDepth} levels`,
      'COMMENT_DEPTH_LIMIT_EXCEEDED',
      400,
    );
  }
}

export class CommentContentException extends DomainException {
  constructor(message: string = 'Invalid comment content') {
    super(message, 'INVALID_COMMENT_CONTENT', 400);
  }
}

export class CommentReactionException extends DomainException {
  constructor(message: string = 'Invalid comment reaction') {
    super(message, 'INVALID_COMMENT_REACTION', 400);
  }
}

export class CommentAlreadyDeletedException extends DomainException {
  constructor(commentId: string) {
    super(
      `Comment '${commentId}' has already been deleted`,
      'COMMENT_ALREADY_DELETED',
      400,
    );
  }
}

export class ParentCommentMismatchException extends DomainException {
  constructor() {
    super(
      'Parent comment must belong to the same post',
      'PARENT_COMMENT_MISMATCH',
      400,
    );
  }
}
