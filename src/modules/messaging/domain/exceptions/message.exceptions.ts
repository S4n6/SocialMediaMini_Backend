import { MESSAGING_ERRORS } from '../../constants';
import { MessagingDomainException } from './conversation.exceptions';

// Message Exceptions
export class MessageNotFoundException extends MessagingDomainException {
  constructor() {
    super(MESSAGING_ERRORS.MESSAGE_NOT_FOUND, 'MESSAGE_NOT_FOUND');
  }
}

export class MessageContentTooLongException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.MESSAGE_CONTENT_TOO_LONG,
      'MESSAGE_CONTENT_TOO_LONG',
    );
  }
}

export class MessageContentEmptyException extends MessagingDomainException {
  constructor() {
    super(MESSAGING_ERRORS.MESSAGE_CONTENT_EMPTY, 'MESSAGE_CONTENT_EMPTY');
  }
}

export class MessageEditTimeExpiredException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.MESSAGE_EDIT_TIME_EXPIRED,
      'MESSAGE_EDIT_TIME_EXPIRED',
    );
  }
}

export class MessageDeleteTimeExpiredException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.MESSAGE_DELETE_TIME_EXPIRED,
      'MESSAGE_DELETE_TIME_EXPIRED',
    );
  }
}

export class MessageEditPermissionDeniedException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.MESSAGE_EDIT_PERMISSION_DENIED,
      'MESSAGE_EDIT_PERMISSION_DENIED',
    );
  }
}

export class MessageDeletePermissionDeniedException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.MESSAGE_DELETE_PERMISSION_DENIED,
      'MESSAGE_DELETE_PERMISSION_DENIED',
    );
  }
}

export class SystemMessageCannotBeEditedException extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.SYSTEM_MESSAGE_CANNOT_BE_EDITED,
      'SYSTEM_MESSAGE_CANNOT_BE_EDITED',
    );
  }
}

export class SystemMessageCannotBeDeletedexception extends MessagingDomainException {
  constructor() {
    super(
      MESSAGING_ERRORS.SYSTEM_MESSAGE_CANNOT_BE_DELETED,
      'SYSTEM_MESSAGE_CANNOT_BE_DELETED',
    );
  }
}
