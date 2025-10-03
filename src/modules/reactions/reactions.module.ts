import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

// Presentation Layer
import { ReactionsController } from './presentation/reactions.controller';

// Application Layer
import { ReactionApplicationService } from './application/reaction-application.service';
import { CreateReactionUseCase } from './application/use-cases/create-reaction.use-case';
import { DeleteReactionUseCase } from './application/use-cases/delete-reaction.use-case';
import { GetReactionUseCase } from './application/use-cases/get-reaction.use-case';
import { GetReactionsUseCase } from './application/use-cases/get-reactions.use-case';
import { GetPostReactionsUseCase } from './application/use-cases/get-post-reactions.use-case';
import { GetReactionStatusUseCase } from './application/use-cases/get-reaction-status.use-case';

// Domain Layer
import { ReactionRepository } from './domain/repositories/reaction.repository';
import { ReactionFactory } from './domain/factories/reaction.factory';
import { ReactionDomainService } from './domain/services/reaction-domain.service';

// Infrastructure Layer
import { PrismaReactionRepository } from './infrastructure/prisma-reaction.repository';
import { PrismaPostService } from './infrastructure/external-services';
import { PrismaCommentService } from './infrastructure/external-services';
import { QueueNotificationService } from './infrastructure/queue-notification.service';

// Application Interfaces
import {
  ExternalPostService,
  ExternalCommentService,
  NotificationService,
} from './application/interfaces/external-services.interface';
import {
  EXTERNAL_POST_SERVICE,
  EXTERNAL_COMMENT_SERVICE,
  NOTIFICATION_SERVICE,
} from './application/interfaces/tokens';

@Module({
  imports: [PrismaModule],
  controllers: [ReactionsController],
  providers: [
    // Application Layer
    ReactionApplicationService,
    CreateReactionUseCase,
    DeleteReactionUseCase,
    GetReactionUseCase,
    GetReactionsUseCase,
    GetPostReactionsUseCase,
    GetReactionStatusUseCase,

    // Domain Layer
    ReactionFactory,
    ReactionDomainService,

    // Infrastructure Layer - Repository
    {
      provide: ReactionRepository,
      useClass: PrismaReactionRepository,
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
      provide: NOTIFICATION_SERVICE,
      useClass: QueueNotificationService,
    },
  ],
  exports: [ReactionApplicationService, ReactionRepository],
})
export class ReactionsModule {}
