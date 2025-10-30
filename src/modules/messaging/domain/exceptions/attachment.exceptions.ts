import { MESSAGING_ERRORS } from '../../constants';
import { MessagingDomainException } from './conversation.exceptions';

// Attachment Exceptions
export class AttachmentTooLargeException extends MessagingDomainException {
  constructor() {
    super(MESSAGING_ERRORS.ATTACHMENT_TOO_LARGE, 'ATTACHMENT_TOO_LARGE');
  }
}

export class AttachmentTypeNotSupportedException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.ATTACHMENT_TYPE_NOT_SUPPORTED,
      'ATTACHMENT_TYPE_NOT_SUPPORTED',
    );
  }
}

export class AttachmentRequiredException extends MessagingDomainException {
  constructor() {
    super(MESSAGING_ERRORS.ATTACHMENT_REQUIRED, 'ATTACHMENT_REQUIRED');
  }
}

// Reaction Exceptions
export class ReactionLimitExceededException extends MessagingDomainException {
  constructor() {
    super(MESSAGING_ERRORS.REACTION_LIMIT_EXCEEDED, 'REACTION_LIMIT_EXCEEDED');
  }
}

export class ReactionEmojiInvalidException extends MessagingDomainException {
  constructor() {
    super(MESSAGING_ERRORS.REACTION_EMOJI_INVALID, 'REACTION_EMOJI_INVALID');
  }
}
