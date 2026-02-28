import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import {
  NOTIFICATION_REPOSITORY_TOKEN,
  NOTIFICATION_STREAM_TOKEN,
} from './notification.constants';

// Application
import { NotificationApplicationService } from './application/notification-application.service';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.use-case';
import { MarkAsReadUseCase } from './application/use-cases/mark-as-read.use-case';
import { GetUnreadCountUseCase } from './application/use-cases/get-unread-count.use-case';

// Subscribers (react to EventEmitter2 events from other modules)
import { SocialEventSubscriber } from './application/subscribers/social-event.subscriber';
import { MediaResultSubscriber } from './application/subscribers/media-result.subscriber';

// Infrastructure
import { NotificationPrismaMapper } from './infrastructure/persistence/mappers/notification-prisma.mapper';
import { NotificationPrismaRepository } from './infrastructure/persistence/repositories/notification-prisma.repository';
import { NotificationStreamAdapter } from './infrastructure/adapters/notification-stream.adapter';

// Presentation
import { NotificationController } from './presentation/controllers/notification.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationController],
  providers: [
    // ── Application service ─────────────────────────────
    NotificationApplicationService,

    // ── Use cases ───────────────────────────────────────
    CreateNotificationUseCase,
    GetNotificationsUseCase,
    MarkAsReadUseCase,
    GetUnreadCountUseCase,

    // ── Subscribers (EventEmitter2) ─────────────────────
    SocialEventSubscriber,
    MediaResultSubscriber,

    // ── Infrastructure → Domain interface bindings ───────
    NotificationPrismaMapper,
    {
      provide: NOTIFICATION_REPOSITORY_TOKEN,
      useClass: NotificationPrismaRepository,
    },
    {
      provide: NOTIFICATION_STREAM_TOKEN,
      useClass: NotificationStreamAdapter,
    },
  ],
  exports: [
    // Other modules can inject this to create notifications programmatically
    NotificationApplicationService,
  ],
})
export class NotificationModule {}
