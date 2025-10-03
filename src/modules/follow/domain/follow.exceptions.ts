import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

export class FollowNotFoundException extends NotFoundException {
  constructor(followId?: string) {
    const message = followId
      ? `Follow relationship with ID '${followId}' not found`
      : 'Follow relationship not found';
    super(message);
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`User with ID '${userId}' not found`);
  }
}

export class SelfFollowException extends BadRequestException {
  constructor() {
    super('You cannot follow yourself');
  }
}

export class AlreadyFollowingException extends ConflictException {
  constructor() {
    super('You are already following this user');
  }
}

export class NotFollowingException extends NotFoundException {
  constructor() {
    super('You are not following this user');
  }
}

export class UnauthorizedFollowActionException extends ForbiddenException {
  constructor() {
    super('You can only modify your own follow relationships');
  }
}
