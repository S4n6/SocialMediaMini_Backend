import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

// Constants
import {
  REACTION_REPOSITORY_TOKEN,
  EXTERNAL_POST_SERVICE_TOKEN,
  EXTERNAL_COMMENT_SERVICE_TOKEN,
  EXTERNAL_USER_SERVICE_TOKEN,
  NOTIFICATION_SERVICE_TOKEN,
} from './constants';

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

// Infrastructure Layer - Persistence
import { ReactionPrismaMapper } from './infrastructure/persistence/mappers/reaction-prisma.mapper';
import { ReactionPrismaRepository } from './infrastructure/persistence/repositories/reaction-prisma.repository';

// Infrastructure Layer - Adapters
import { PrismaPostAdapter } from './infrastructure/adapters/prisma-post.adapter';
import { PrismaCommentAdapter } from './infrastructure/adapters/prisma-comment.adapter';
import { PrismaUserAdapter } from './infrastructure/adapters/prisma-user.adapter';
import { DirectNotificationAdapter } from './infrastructure/adapters/direct-notification.adapter';

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

    // Infrastructure - Persistence
    ReactionPrismaMapper,
    {
      provide: REACTION_REPOSITORY_TOKEN,
      useClass: ReactionPrismaRepository,
    },

    // Infrastructure - Adapters
    {
      provide: EXTERNAL_POST_SERVICE_TOKEN,
      useClass: PrismaPostAdapter,
    },
    {
      provide: EXTERNAL_COMMENT_SERVICE_TOKEN,
      useClass: PrismaCommentAdapter,
    },
    {
      provide: EXTERNAL_USER_SERVICE_TOKEN,
      useClass: PrismaUserAdapter,
    },
    {
      provide: NOTIFICATION_SERVICE_TOKEN,
      useClass: DirectNotificationAdapter,
    },
  ],
  exports: [ReactionApplicationService, REACTION_REPOSITORY_TOKEN],
})
export class ReactionsModule {}
