export class NotificationNotFoundException extends Error {
  constructor(notificationId: string) {
    super(`Notification with ID ${notificationId} not found`);
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

export class InvalidNotificationTypeException extends Error {
  constructor(type: string) {
    super(`Invalid notification type: ${type}`);
    this.name = 'InvalidNotificationTypeException';
  }
}

export class InvalidNotificationContentException extends Error {
  constructor(message: string) {
    super(`Invalid notification content: ${message}`);
    this.name = 'InvalidNotificationContentException';
  }
}

export class NotificationAlreadyReadException extends Error {
  constructor(notificationId: string) {
    super(`Notification ${notificationId} is already marked as read`);
    this.name = 'NotificationAlreadyReadException';
  }
}

export class NotificationAlreadyUnreadException extends Error {
  constructor(notificationId: string) {
    super(`Notification ${notificationId} is already marked as unread`);
    this.name = 'NotificationAlreadyUnreadException';
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
    super('Invalid user ID provided for notification');
    this.name = 'InvalidUserIdException';
  }
}

export class NotificationBulkOperationException extends Error {
  constructor(operation: string, failedIds: string[]) {
    super(
      `Bulk ${operation} operation failed for notifications: ${failedIds.join(', ')}`,
    );
    this.name = 'NotificationBulkOperationException';
  }
}
