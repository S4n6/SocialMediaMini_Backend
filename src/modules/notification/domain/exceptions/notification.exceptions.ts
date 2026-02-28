/**
 * Domain exceptions — pure TypeScript, no framework imports.
 */

export class NotificationNotFoundException extends Error {
  constructor(id: string) {
    super(`Notification ${id} not found`);
    this.name = 'NotificationNotFoundException';
  }
}

export class UnauthorizedNotificationAccessException extends Error {
  constructor(notificationId: string, userId: string) {
    super(
      `User ${userId} is not authorized to access notification ${notificationId}`,
    );
    this.name = 'UnauthorizedNotificationAccessException';
  }
}

export class InvalidNotificationContentException extends Error {
  constructor(message: string) {
    super(`Invalid notification content: ${message}`);
    this.name = 'InvalidNotificationContentException';
  }
}

export class NotificationAlreadyReadException extends Error {
  constructor(id: string) {
    super(`Notification ${id} is already read`);
    this.name = 'NotificationAlreadyReadException';
  }
}

export class EmptyNotificationTitleException extends Error {
  constructor() {
    super('Notification title cannot be empty');
    this.name = 'EmptyNotificationTitleException';
  }
}

export class EmptyNotificationContentException extends Error {
  constructor() {
    super('Notification content cannot be empty');
    this.name = 'EmptyNotificationContentException';
  }
}

export class InvalidUserIdException extends Error {
  constructor() {
    super('Invalid user ID provided');
    this.name = 'InvalidUserIdException';
  }
}
