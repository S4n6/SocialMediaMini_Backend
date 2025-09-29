import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';

// Presentation Layer
import {
  NotificationController,
  NotificationGateway,
  NotificationProcessor,
} from './presentation';

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
  NOTIFICATION_REPOSITORY_TOKEN,
} from './application';

// Domain Layer
import { NotificationDomainService, NotificationFactory } from './domain';

// Infrastructure Layer
import {
  NotificationRepository,
  NotificationApplicationRepository,
  EmailNotificationService,
  PushNotificationService,
  RealtimeNotificationService,
} from './infrastructure';

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

    // Domain Layer
    NotificationDomainService,
    NotificationFactory,

    // Infrastructure Layer - Repositories
    NotificationRepository,
    NotificationApplicationRepository,
    {
      provide: NOTIFICATION_REPOSITORY_TOKEN,
      useClass: NotificationRepository,
    },

    // Infrastructure Layer - External Services
    EmailNotificationService,
    PushNotificationService,
    RealtimeNotificationService,

    // WebSocket Gateway
    NotificationGateway,

    // Queue Processor
    NotificationProcessor,
  ],
  exports: [
    // Export application service for other modules
    NotificationApplicationService,

    // Export external services for other modules
    EmailNotificationService,
    PushNotificationService,
    RealtimeNotificationService,

    // Export presentation layer
    NotificationGateway,
  ],
})
export class NotificationModule {}
