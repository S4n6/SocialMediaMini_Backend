import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

// Constants - Flat DI Tokens
import {
  FOLLOW_REPOSITORY_TOKEN,
  EXTERNAL_USER_SERVICE_TOKEN,
  NOTIFICATION_SERVICE_TOKEN,
} from './constants';

// Presentation Layer
import { FollowsController } from './presentation/follows.controller';

// Application Layer
import { FollowApplicationService } from './application/follow-application.service';
import { FollowEnrichmentService } from './application/services/follow-enrichment.service';
import { FollowUserUseCase } from './application/use-cases/follow-user.use-case';
import { UnfollowUserUseCase } from './application/use-cases/unfollow-user.use-case';
import { GetFollowersUseCase } from './application/use-cases/get-followers.use-case';
import { GetFollowingUseCase } from './application/use-cases/get-following.use-case';
import { GetFollowStatusUseCase } from './application/use-cases/get-follow-status.use-case';
import { GetFollowsUseCase } from './application/use-cases/get-follows.use-case';

// Application Layer - Event Subscribers
import { FollowNotificationSubscriber } from './application/subscribers/follow-notification.subscriber';

// Infrastructure Layer - Repository
import { PrismaFollowRepository } from './infrastructure/persistence/repositories/prisma-follow.repository';

// Infrastructure Layer - Adapters
import { UserAdapter } from './infrastructure/adapters/user-adapter';
import { NotificationAdapter } from './infrastructure/adapters/notification-adapter';

/**
 * Follow Module - Clean Architecture Implementation
 *
 * Dependencies flow: Presentation → Application → Domain ← Infrastructure
 * - Domain layer has no framework dependencies (pure TypeScript)
 * - Application layer depends only on domain interfaces
 * - Infrastructure implements domain interfaces + application ports
 * - Presentation uses application services
 * - Side effects handled via event subscribers (@OnEvent)
 */
@Module({
  imports: [PrismaModule],
  controllers: [FollowsController],
  providers: [
    // Application Layer - Services
    FollowApplicationService,
    FollowEnrichmentService,

    // Application Layer - Use Cases
    FollowUserUseCase,
    UnfollowUserUseCase,
    GetFollowersUseCase,
    GetFollowingUseCase,
    GetFollowStatusUseCase,
    GetFollowsUseCase,

    // Application Layer - Event Subscribers
    FollowNotificationSubscriber,

    // Infrastructure Layer - Repository
    {
      provide: FOLLOW_REPOSITORY_TOKEN,
      useClass: PrismaFollowRepository,
    },

    // Infrastructure Layer - External Service Adapters
    {
      provide: EXTERNAL_USER_SERVICE_TOKEN,
      useClass: UserAdapter,
    },
    {
      provide: NOTIFICATION_SERVICE_TOKEN,
      useClass: NotificationAdapter,
    },
  ],
  exports: [FollowApplicationService, FOLLOW_REPOSITORY_TOKEN],
})
export class FollowsModule {}
