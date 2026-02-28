import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UsersModule } from '../users/users.module';

// Constants & Tokens
import {
  COMMENT_TOKENS,
  APPLICATION_TOKENS,
  INFRASTRUCTURE_TOKENS,
} from './constants';

// Domain
import { CommentDomainService } from './domain/services/comment-domain.service';
import { ICommentRepository } from './domain/repositories/i-comment.repository';
import {
  IUserDomainPort,
  IPostDomainPort,
} from './domain/interfaces/domain-ports.interface';

// Application
import { CommentApplicationServiceImpl } from './application/services/comment-application.service';
import { CommentEnrichmentService } from './application/services/comment-enrichment.service';
import { CreateCommentUseCase } from './application/use-cases/create-comment.use-case';
import { GetCommentsByPostUseCase } from './application/use-cases/get-comments-by-post.use-case';
import { GetCommentByIdUseCase } from './application/use-cases/get-comment-by-id.use-case';
import { UpdateCommentUseCase } from './application/use-cases/update-comment.use-case';
import { DeleteCommentUseCase } from './application/use-cases/delete-comment.use-case';
import { AddReactionUseCase } from './application/use-cases/add-reaction.use-case';
import { RemoveReactionUseCase } from './application/use-cases/remove-reaction.use-case';
import { GetRepliesUseCase } from './application/use-cases/get-replies.use-case';

// Infrastructure
import { PrismaCommentRepository } from './infrastructure/comment.prisma.repository';
import { CommentPersistenceMapper } from './infrastructure/persistence/mappers/comment.mapper';
import { CommentDtoMapper } from './infrastructure/mappers/comment-dto.mapper';
import { UserServiceAdapter } from './infrastructure/adapters/user-service.adapter';
import { PostServiceAdapter } from './infrastructure/adapters/post-service.adapter';
import { CommentCacheService } from './infrastructure/cache/comment-cache.service';

// Presentation
import { CommentsController } from './presentation/comments.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CommentsController],
  providers: [
    // ── Infrastructure ──────────────────────────────────────────────
    CommentPersistenceMapper,
    CommentCacheService,
    {
      provide: COMMENT_TOKENS.COMMENT_REPOSITORY,
      useClass: PrismaCommentRepository,
    },
    {
      provide: INFRASTRUCTURE_TOKENS.USER_SERVICE_ADAPTER,
      useClass: UserServiceAdapter,
    },
    {
      provide: INFRASTRUCTURE_TOKENS.POST_SERVICE_ADAPTER,
      useClass: PostServiceAdapter,
    },
    {
      provide: APPLICATION_TOKENS.COMMENT_MAPPER,
      useClass: CommentDtoMapper,
    },

    // ── Domain (pure TS — wired via useFactory) ─────────────────────
    {
      provide: COMMENT_TOKENS.COMMENT_DOMAIN_SERVICE,
      useFactory: (
        repo: ICommentRepository,
        userPort: IUserDomainPort,
        postPort: IPostDomainPort,
      ) => new CommentDomainService(repo, userPort, postPort),
      inject: [
        COMMENT_TOKENS.COMMENT_REPOSITORY,
        INFRASTRUCTURE_TOKENS.USER_SERVICE_ADAPTER,
        INFRASTRUCTURE_TOKENS.POST_SERVICE_ADAPTER,
      ],
    },

    // ── Application ─────────────────────────────────────────────────
    {
      provide: APPLICATION_TOKENS.COMMENT_APPLICATION_SERVICE,
      useClass: CommentApplicationServiceImpl,
    },
    CommentEnrichmentService,

    // Use Cases
    CreateCommentUseCase,
    GetCommentsByPostUseCase,
    GetCommentByIdUseCase,
    UpdateCommentUseCase,
    DeleteCommentUseCase,
    AddReactionUseCase,
    RemoveReactionUseCase,
    GetRepliesUseCase,
  ],
  exports: [APPLICATION_TOKENS.COMMENT_APPLICATION_SERVICE],
})
export class CommentsModule {}
