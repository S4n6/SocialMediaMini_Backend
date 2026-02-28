import {
  ValidationException,
  EntityNotFoundException,
  BusinessRuleException,
  ForbiddenException,
} from '../../../shared/exceptions/domain.exception';

export class InvalidUserIdException extends ValidationException {
  constructor(message: string = 'Invalid user ID') {
    super(message, { userId: [message] }, 'INVALID_USER_ID');
  }
}

export class SearchHistoryNotFoundException extends EntityNotFoundException {
  constructor(userId: string = 'unknown') {
    super('SearchHistory', userId);
  }
}

export class DuplicateSearchEntryException extends BusinessRuleException {
  constructor(message: string = 'Duplicate search entry') {
    super(message, 'DUPLICATE_SEARCH_ENTRY');
  }
}

export class SearchHistoryLimitExceededException extends BusinessRuleException {
  constructor(message: string = 'Search history limit exceeded') {
    super(message, 'SEARCH_HISTORY_LIMIT_EXCEEDED');
  }
}

export class UnauthorizedSearchHistoryActionException extends ForbiddenException {
  constructor(message: string = 'Unauthorized search history action') {
    super(message, 'UNAUTHORIZED_SEARCH_HISTORY_ACTION');
  }
}
