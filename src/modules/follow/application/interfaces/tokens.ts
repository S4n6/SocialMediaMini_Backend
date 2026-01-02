// Re-export tokens from main constants file
export { FOLLOW_MODULE_TOKENS } from '../../constants';

// Legacy tokens for backward compatibility (will be removed)
export const EXTERNAL_USER_SERVICE = Symbol('ExternalUserService');
export const NOTIFICATION_SERVICE = Symbol('NotificationService');
export const EVENT_BUS = Symbol('EventBus');
