import { DomainException } from '../../../shared/exceptions/domain.exception';

export class PostMediaNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(
      `Post media with identifier '${identifier}' not found`,
      'POST_MEDIA_NOT_FOUND',
      404,
    );
  }
}

export class InvalidPostMediaException extends DomainException {
  constructor(message: string = 'Invalid post media data') {
    super(message, 'INVALID_POST_MEDIA', 400);
  }
}

export class UnauthorizedPostMediaActionException extends DomainException {
  constructor(action: string = 'perform this action') {
    super(
      `You are not authorized to ${action} on this post media`,
      'UNAUTHORIZED_POST_MEDIA_ACTION',
      403,
    );
  }
}

export class InvalidMediaTypeException extends DomainException {
  constructor(message: string = 'Invalid media type') {
    super(message, 'INVALID_MEDIA_TYPE', 400);
  }
}

export class InvalidMediaOrderException extends DomainException {
  constructor(message: string = 'Invalid media order') {
    super(message, 'INVALID_MEDIA_ORDER', 400);
  }
}

export class PostMediaUploadFailedException extends DomainException {
  constructor(reason: string = 'Unknown error') {
    super(
      `Failed to upload post media: ${reason}`,
      'POST_MEDIA_UPLOAD_FAILED',
      500,
    );
  }
}

export class TooManyMediaFilesException extends DomainException {
  constructor(message: string = 'Too many media files') {
    super(message, 'TOO_MANY_MEDIA_FILES', 400);
  }
}

export class PostMediaDuplicateException extends DomainException {
  constructor(url: string) {
    super(
      `Post media with URL '${url}' already exists`,
      'POST_MEDIA_DUPLICATE',
      409,
    );
  }
}

export class PostMediaLimitExceededException extends DomainException {
  constructor(limit: number) {
    super(
      `Cannot add more than ${limit} media files per post`,
      'POST_MEDIA_LIMIT_EXCEEDED',
      400,
    );
  }
}
