export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export class InvalidUserIdException extends DomainException {
  constructor(message: string = 'Invalid user ID') {
    super(message);
    this.name = 'InvalidUserIdException';
  }
}

export class SearchHistoryNotFoundException extends DomainException {
  constructor(message: string = 'Search history not found') {
    super(message);
    this.name = 'SearchHistoryNotFoundException';
  }
}

export class DuplicateSearchEntryException extends DomainException {
  constructor(message: string = 'Duplicate search entry') {
    super(message);
    this.name = 'DuplicateSearchEntryException';
  }
}

export class SearchHistoryLimitExceededException extends DomainException {
  constructor(message: string = 'Search history limit exceeded') {
    super(message);
    this.name = 'SearchHistoryLimitExceededException';
  }
}

export class UnauthorizedSearchHistoryActionException extends DomainException {
  constructor(message: string = 'Unauthorized search history action') {
    super(message);
    this.name = 'UnauthorizedSearchHistoryActionException';
  }
}
