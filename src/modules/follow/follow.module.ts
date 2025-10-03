import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

// Presentation Layer
import { FollowsController } from './presentation/follows.controller';

// Application Layer
import { FollowApplicationService } from './application/follow-application.service';
import { FollowUserUseCase } from './application/use-cases/follow-user.use-case';
import { UnfollowUserUseCase } from './application/use-cases/unfollow-user.use-case';
import { GetFollowersUseCase } from './application/use-cases/get-followers.use-case';
import { GetFollowingUseCase } from './application/use-cases/get-following.use-case';
import { GetFollowStatusUseCase } from './application/use-cases/get-follow-status.use-case';
import { GetFollowsUseCase } from './application/use-cases/get-follows.use-case';

// Domain Layer
import { FollowRepository } from './domain/repositories/follow.repository';
import { FollowFactory } from './domain/factories/follow.factory';
import { FollowDomainService } from './domain/services/follow-domain.service';

// Infrastructure Layer
import { PrismaFollowRepository } from './infrastructure/prisma-follow.repository';
import { PrismaUserService } from './infrastructure/external-services';
import { QueueNotificationService } from './infrastructure/queue-notification.service';

// Application Interfaces
import {
  EXTERNAL_USER_SERVICE,
  NOTIFICATION_SERVICE,
} from './application/interfaces/tokens';

@Module({
  imports: [PrismaModule],
  controllers: [FollowsController],
  providers: [
    // Application Layer
    FollowApplicationService,
    FollowUserUseCase,
    UnfollowUserUseCase,
    GetFollowersUseCase,
    GetFollowingUseCase,
    GetFollowStatusUseCase,
    GetFollowsUseCase,

    // Domain Layer
    FollowFactory,
    FollowDomainService,

    // Infrastructure Layer - Repository
    {
      provide: FollowRepository,
      useClass: PrismaFollowRepository,
    },

    // Infrastructure Layer - External Services
    {
      provide: EXTERNAL_USER_SERVICE,
      useClass: PrismaUserService,
    },
    {
      provide: NOTIFICATION_SERVICE,
      useClass: QueueNotificationService,
    },
  ],
  exports: [FollowApplicationService, FollowRepository],
})
export class FollowsModule {}
