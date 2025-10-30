import { MESSAGING_ERRORS } from '../../constants';

// Base Domain Exception
export abstract class MessagingDomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Conversation Exceptions
export class ConversationNotFoundException extends MessagingDomainException {
  constructor() {
    super(MESSAGING_ERRORS.CONVERSATION_NOT_FOUND, 'CONVERSATION_NOT_FOUND');
  }
}

export class ConversationAccessDeniedException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.CONVERSATION_ACCESS_DENIED,
      'CONVERSATION_ACCESS_DENIED',
    );
  }
}

export class ConversationParticipantLimitExceededException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.CONVERSATION_PARTICIPANT_LIMIT_EXCEEDED,
      'CONVERSATION_PARTICIPANT_LIMIT_EXCEEDED',
    );
  }
}

export class ConversationTitleTooLongException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.CONVERSATION_TITLE_TOO_LONG,
      'CONVERSATION_TITLE_TOO_LONG',
    );
  }
}
