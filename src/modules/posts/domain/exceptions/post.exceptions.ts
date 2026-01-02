/**
 * Domain exceptions for Post entity
 * These represent business rule violations in the posts domain
 */

export class PostDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PostDomainException';
  }
}

export class InvalidPostContentException extends PostDomainException {
  constructor(message: string = 'Invalid post content') {
    super(message);
    this.name = 'InvalidPostContentException';
  }
}

export class EmptyPostContentException extends PostDomainException {
  constructor(message: string = 'Post must have content or media') {
    super(message);
    this.name = 'EmptyPostContentException';
  }
}

export class PostNotFoundException extends PostDomainException {
  constructor(postId: string) {
    super(`Post with ID ${postId} not found`);
    this.name = 'PostNotFoundException';
  }
}

export class UnauthorizedPostActionException extends PostDomainException {
  constructor(action: string = 'perform this action') {
    super(`You are not authorized to ${action} on this post`);
    this.name = 'UnauthorizedPostActionException';
  }
}

export class PostAlreadyLikedException extends PostDomainException {
  constructor(message: string = 'Post is already liked by this user') {
    super(message);
    this.name = 'PostAlreadyLikedException';
  }
}

export class PostNotLikedException extends PostDomainException {
  constructor(message: string = 'Post is not liked by this user') {
    super(message);
    this.name = 'PostNotLikedException';
  }
}

export class PostContentTooLongException extends PostDomainException {
  constructor(maxLength: number = 2000) {
    super(`Post content cannot exceed ${maxLength} characters`);
    this.name = 'PostContentTooLongException';
  }
}

export class InvalidPostPrivacyException extends PostDomainException {
  constructor(privacy: string) {
    super(`Invalid post privacy setting: ${privacy}`);
    this.name = 'InvalidPostPrivacyException';
  }
}

export class PostMediaLimitExceededException extends PostDomainException {
  constructor(maxMedia: number = 10) {
    super(`Post cannot have more than ${maxMedia} media items`);
    this.name = 'PostMediaLimitExceededException';
  }
}

export class InvalidMediaTypeException extends PostDomainException {
  constructor(mediaType: string) {
    super(
      `Invalid media type: ${mediaType}. Only 'image' and 'video' are allowed`,
    );
    this.name = 'InvalidMediaTypeException';
  }
}

export class PostCannotBeEditedException extends PostDomainException {
  constructor(reason: string = 'Post cannot be edited') {
    super(reason);
    this.name = 'PostCannotBeEditedException';
  }
}

export class PostCannotBeDeletedException extends PostDomainException {
  constructor(reason: string = 'Post cannot be deleted') {
    super(reason);
    this.name = 'PostCannotBeDeletedException';
  }
}

export class CommentNotFoundException extends PostDomainException {
  constructor(commentId: string) {
    super(`Comment with ID ${commentId} not found`);
    this.name = 'CommentNotFoundException';
  }
}

export class InvalidCommentContentException extends PostDomainException {
  constructor(message: string = 'Comment content is invalid') {
    super(message);
    this.name = 'InvalidCommentContentException';
  }
}

export class MediaNotFoundException extends PostDomainException {
  constructor(mediaId: string) {
    super(`Media with ID ${mediaId} not found`);
    this.name = 'MediaNotFoundException';
  }
}
