import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UsersModule } from '../users/users.module';

// Constants & Tokens
import {
  COMMENT_TOKENS,
  APPLICATION_TOKENS,
  INFRASTRUCTURE_TOKENS,
} from './constants';

// Domain Services
import { CommentDomainService } from './domain/services/comment-domain.service';

// Application Layer
import { CommentApplicationService } from './application/interfaces/comment-application.interface';
import {
  CommentApplicationServiceImpl,
  CommentMapperImpl,
} from './application/services/comment-application.service';

// Use Cases
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
import { UserServiceAdapter } from './infrastructure/adapters/user-service.adapter';
import { PostServiceAdapter } from './infrastructure/adapters/post-service.adapter';

// Application Services
import { CommentEnrichmentService } from './application/services/comment-enrichment.service';

// Presentation
import { CommentsController } from './presentation/comments.controller';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [CommentsController],
  providers: [
    // Domain Services
    CommentDomainService,

    // Application Services
    {
      provide: APPLICATION_TOKENS.COMMENT_APPLICATION_SERVICE,
      useClass: CommentApplicationServiceImpl,
    },
    {
      provide: APPLICATION_TOKENS.COMMENT_MAPPER,
      useClass: CommentMapperImpl,
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

    // Repository
    {
      provide: COMMENT_TOKENS.COMMENT_REPOSITORY,
      useClass: PrismaCommentRepository,
    },

    // External Service Adapters (implementing domain ports)
    {
      provide: INFRASTRUCTURE_TOKENS.USER_SERVICE_ADAPTER,
      useClass: UserServiceAdapter,
    },
    {
      provide: INFRASTRUCTURE_TOKENS.POST_SERVICE_ADAPTER,
      useClass: PostServiceAdapter,
    },
  ],
  exports: [APPLICATION_TOKENS.COMMENT_APPLICATION_SERVICE],
})
export class CommentsModule {}
