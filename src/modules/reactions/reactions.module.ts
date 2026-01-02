import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaModule } from '../../database/prisma.module';

// Presentation Layer
import { ReactionsController } from './presentation';

// Application Layer
import {
  ReactionApplicationService,
  CreateReactionUseCase,
  DeleteReactionUseCase,
  GetReactionUseCase,
  GetReactionsUseCase,
  GetPostReactionsUseCase,
  GetReactionStatusUseCase,
  ReactionValidationService,
  ReactionEnrichmentService,
  ExternalPostService,
  ExternalCommentService,
  ExternalUserService,
  NotificationService,
} from './application';

// Domain Layer
import {
  ReactionRepository,
  ReactionFactory,
  ReactionDomainService,
  ReactionBusinessRulesService,
  ReactionOperationService,
  IReactionBaseRepository,
  IReactionFinderRepository,
  IReactionStatsRepository,
} from './domain';

// Infrastructure Layer
import {
  PrismaReactionRepository,
  EnhancedPrismaReactionRepository,
  PrismaPostService,
  PrismaCommentService,
  PrismaUserService,
  QueueNotificationService,
  CacheAdapter,
  EventPublisherAdapter,
  MetricsAdapter,
} from './infrastructure';

// Presentation Layer - Filters and Mappers
import { ReactionExceptionFilter } from './presentation/filters/reaction-exception.filter';
import { ReactionResponseMapper } from './presentation/mappers/reaction-response.mapper';

// Constants and tokens
import {
  EXTERNAL_POST_SERVICE,
  EXTERNAL_COMMENT_SERVICE,
  EXTERNAL_USER_SERVICE,
  NOTIFICATION_SERVICE,
  REACTION_BASE_REPOSITORY,
  REACTION_FINDER_REPOSITORY,
  REACTION_STATS_REPOSITORY,
} from './constants';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      ttl: 300, // 5 minutes default TTL
      max: 1000, // Maximum number of items in cache
    }),
  ],
  controllers: [ReactionsController],
  providers: [
    // Application Layer - Enhanced Services
    ReactionApplicationService,
    CreateReactionUseCase,
    DeleteReactionUseCase,
    GetReactionUseCase,
    GetReactionsUseCase,
    GetPostReactionsUseCase,
    GetReactionStatusUseCase,
    ReactionValidationService,
    ReactionEnrichmentService,

    // Domain Layer
    ReactionFactory,
    ReactionDomainService,
    ReactionBusinessRulesService,
    ReactionOperationService,

    // Infrastructure Layer - Enhanced Repository
    {
      provide: ReactionRepository,
      useClass: EnhancedPrismaReactionRepository,
    },
    {
      provide: REACTION_BASE_REPOSITORY,
      useExisting: ReactionRepository,
    },
    {
      provide: REACTION_FINDER_REPOSITORY,
      useExisting: ReactionRepository,
    },
    {
      provide: REACTION_STATS_REPOSITORY,
      useExisting: ReactionRepository,
    },

    // Infrastructure Layer - Adapters
    {
      provide: 'CACHE_ADAPTER',
      useClass: CacheAdapter,
    },
    {
      provide: 'EVENT_PUBLISHER_ADAPTER',
      useClass: EventPublisherAdapter,
    },
    {
      provide: 'METRICS_ADAPTER',
      useClass: MetricsAdapter,
    },

    // Infrastructure Layer - External Services
    {
      provide: EXTERNAL_POST_SERVICE,
      useClass: PrismaPostService,
    },
    {
      provide: EXTERNAL_COMMENT_SERVICE,
      useClass: PrismaCommentService,
    },
    {
      provide: EXTERNAL_USER_SERVICE,
      useClass: PrismaUserService,
    },
    {
      provide: NOTIFICATION_SERVICE,
      useClass: QueueNotificationService,
    },

    // Presentation Layer - Mappers and Filters
    ReactionResponseMapper,
    ReactionExceptionFilter,
  ],
  exports: [
    ReactionApplicationService,
    ReactionRepository,
    'CACHE_ADAPTER',
    'EVENT_PUBLISHER_ADAPTER',
    'METRICS_ADAPTER',
    ReactionResponseMapper,
  ],
})
export class ReactionsModule {}
