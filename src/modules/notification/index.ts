// Export the main module
export * from './notification.module';

// Export main application service for other modules
export * from './application/notification-application.service';

// Export DTOs for other modules
export * from './application/dto/notification.dto';

// Export domain types for other modules
export * from './domain/entities/notification.entity';
export * from './domain/notification.events';

// Export external services for other modules
export * from './infrastructure/services/email-notification.service';
export * from './infrastructure/services/push-notification.service';
export * from './infrastructure/services/realtime-notification.service';

// Export presentation layer controllers and processors only
export { NotificationController } from './presentation/controllers/notification.controller';
// export { NotificationProcessor } from './presentation/processors/notification.processor'; // Removed worker functionality
