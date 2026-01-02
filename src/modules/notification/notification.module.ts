import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';

// Presentation Layer
import { NotificationController, NotificationProcessor } from './presentation';

// Constants
import {
  NOTIFICATION_REPOSITORY_TOKEN,
  DOMAIN_EVENT_PUBLISHER_TOKEN,
} from './constants';

// Application Layer
import { NotificationApplicationService } from './application/notification-application.service';
import {
  CreateNotificationUseCase,
  GetNotificationUseCase,
  GetNotificationsUseCase,
  UpdateNotificationUseCase,
  MarkAsReadUseCase,
  MarkAsUnreadUseCase,
  DeleteNotificationUseCase,
  GetNotificationStatsUseCase,
  GetRealtimeNotificationsUseCase,
  NotificationCleanupUseCase,
} from './application';

// Domain Layer
import { NotificationDomainService, NotificationFactory } from './domain';

// Infrastructure Layer
import {
  NotificationRepository,
  EmailNotificationService,
  PushNotificationService,
  RealtimeNotificationService,
  DomainEventPublisher,
  NotificationChannelAdapter,
} from './infrastructure';

// WebSocket Layer
// import {
//   NotificationWebSocketService,
//   NotificationWebSocketRegistrationService,
// } from './application/services'; // TODO: Refactor - WebSocket cũ
// import {
//   NotificationMarkReadHandler,
//   NotificationMarkAllReadHandler,
//   NotificationSubscribeHandler,
//   NotificationUnsubscribeHandler,
//   NotificationGetHistoryHandler,
// } from './application/handlers'; // TODO: Refactor - WebSocket cũ

// Import WebSocket module
import { WebSocketModule } from '../../infrastructure/websocket';

// Configuration
import { JWT } from '../../config/jwt.config';
import { QUEUE } from '../../config/queue.config';
import { REDIS } from '../../config/redis.config';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [
    JwtModule.register({
      secret: JWT.SECRET,
    }),
    BullModule.forRoot({
      connection: {
        url: REDIS.URL_WORKER,
      },
    }),
    BullModule.registerQueue({ name: QUEUE.NOTIFICATION }),
    PrismaModule,
    WebSocketModule, // Import WebSocket module for handlers registration
  ],
  controllers: [NotificationController],
  providers: [
    // Application Layer
    NotificationApplicationService,

    // Use Cases
    CreateNotificationUseCase,
    GetNotificationUseCase,
    GetNotificationsUseCase,
    UpdateNotificationUseCase,
    MarkAsReadUseCase,
    MarkAsUnreadUseCase,
    DeleteNotificationUseCase,
    GetNotificationStatsUseCase,
    GetRealtimeNotificationsUseCase,
    NotificationCleanupUseCase,

    // Domain Layer - Pure services (no @Injectable)
    {
      provide: NotificationDomainService,
      useFactory: () => new NotificationDomainService(),
    },
    {
      provide: NotificationFactory,
      useFactory: () => new NotificationFactory(),
    },

    // Infrastructure Layer - Repositories
    NotificationRepository,
    {
      provide: NOTIFICATION_REPOSITORY_TOKEN,
      useClass: NotificationRepository,
    },

    // Infrastructure Layer - External Services
    EmailNotificationService,
    PushNotificationService,
    RealtimeNotificationService,

    // Infrastructure Layer - Adapters
    NotificationChannelAdapter,

    // Domain Event Publisher
    {
      provide: DOMAIN_EVENT_PUBLISHER_TOKEN,
      useClass: DomainEventPublisher,
    },

    // Queue Processor
    NotificationProcessor,

    // WebSocket Layer - TODO: Refactor - WebSocket cũ
    // NotificationWebSocketService,
    // NotificationWebSocketRegistrationService,

    // WebSocket Handlers - TODO: Refactor - WebSocket cũ
    // NotificationMarkReadHandler,
    // NotificationMarkAllReadHandler,
    // NotificationSubscribeHandler,
    // NotificationUnsubscribeHandler,
    // NotificationGetHistoryHandler,
  ],
  exports: [
    // Export application service for other modules
    NotificationApplicationService,

    // Export external services for other modules
    EmailNotificationService,
    PushNotificationService,
    RealtimeNotificationService,

    // Export WebSocket services for other modules - TODO: Refactor - WebSocket cũ
    // NotificationWebSocketService,

    // Export presentation layer
  ],
})
export class NotificationModule {}
