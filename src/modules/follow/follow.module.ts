import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

// Constants
import { FOLLOW_MODULE_TOKENS } from './constants';

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

// Domain Layer
import { FollowFactory } from './domain/factories/follow.factory';

// Infrastructure Layer
import { PrismaFollowRepository } from './infrastructure/prisma-follow.repository';
import { UserAdapter } from './infrastructure/adapters/user-adapter';
import { NotificationAdapter } from './infrastructure/adapters/notification-adapter';

/**
 * Follow Module - Clean Architecture Implementation
 *
 * Dependencies flow: Presentation → Application → Domain ← Infrastructure
 * - Domain layer has no dependencies
 * - Application layer depends only on domain interfaces
 * - Infrastructure implements domain interfaces
 * - Presentation uses application services
 */
@Module({
  imports: [PrismaModule],
  controllers: [FollowsController],
  providers: [
    // Application Layer Services
    FollowApplicationService,
    FollowEnrichmentService,

    // Application Layer Use Cases
    FollowUserUseCase,
    UnfollowUserUseCase,
    GetFollowersUseCase,
    GetFollowingUseCase,
    GetFollowStatusUseCase,
    GetFollowsUseCase,

    // Domain Layer Services & Factories
    FollowFactory,

    // Infrastructure Layer - Repository Implementation
    {
      provide: FOLLOW_MODULE_TOKENS.FOLLOW_REPOSITORY,
      useClass: PrismaFollowRepository,
    },

    // Infrastructure Layer - External Service Adapters
    {
      provide: FOLLOW_MODULE_TOKENS.EXTERNAL_USER_SERVICE,
      useClass: UserAdapter,
    },
    {
      provide: FOLLOW_MODULE_TOKENS.NOTIFICATION_SERVICE,
      useClass: NotificationAdapter,
    },
  ],
  exports: [FollowApplicationService, FOLLOW_MODULE_TOKENS.FOLLOW_REPOSITORY],
})
export class FollowsModule {}
