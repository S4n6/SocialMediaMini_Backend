import {
  EntityNotFoundException,
  BusinessRuleException,
  EntityAlreadyExistsException,
  ForbiddenException,
} from '../../../shared/exceptions/domain.exception';

export class FollowNotFoundException extends EntityNotFoundException {
  constructor(followId?: string) {
    super('Follow', followId ?? 'unknown');
  }
}

export class UserNotFoundException extends EntityNotFoundException {
  constructor(userId: string) {
    super('User', userId);
  }
}

export class SelfFollowException extends BusinessRuleException {
  constructor() {
    super('You cannot follow yourself', 'SELF_FOLLOW');
  }
}

export class AlreadyFollowingException extends EntityAlreadyExistsException {
  constructor(followerId: string = 'unknown', followingId: string = 'unknown') {
    super('Follow', `${followerId}->${followingId}`);
  }
}

export class NotFollowingException extends EntityNotFoundException {
  constructor() {
    super('Follow', 'relationship');
  }
}

export class UnauthorizedFollowActionException extends ForbiddenException {
  constructor() {
    super(
      'You can only modify your own follow relationships',
      'FOLLOW_FORBIDDEN',
    );
  }
}
