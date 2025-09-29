// Export the main module
export * from './notification.module';

// Export main application service for other modules
export * from './application/notification-application.service';

// Export DTOs for other modules
export * from './application/dto/notification.dto';

// Export domain types for other modules
export * from './domain/notification.entity';
export * from './domain/notification.events';

// Export external services for other modules
export * from './infrastructure/services/email-notification.service';
export * from './infrastructure/services/push-notification.service';
export * from './infrastructure/services/realtime-notification.service';

// Export presentation layer controllers, gateways, processors only
export { NotificationController } from './presentation/controllers/notification.controller';
export { NotificationGateway } from './presentation/gateways/notification.gateway';
export { NotificationProcessor } from './presentation/processors/notification.processor';
