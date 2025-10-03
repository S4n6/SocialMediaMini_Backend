import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UsersModule } from '../users/users.module';

// Domain Services
import { CommentDomainService } from './domain/services/comment-domain.service';

// Application Layer
import { CommentApplicationService } from './application/interfaces/comment-application.interface';
import {
  CommentApplicationServiceImpl,
  CommentMapperImpl,
} from './application/comment-application.service';

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
import { PrismaCommentRepository } from './infrastructure/repositories/prisma-comment.repository';
import {
  MockUserService,
  MockPostService,
} from './infrastructure/mock-services';

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
      provide: 'CommentApplicationService',
      useClass: CommentApplicationServiceImpl,
    },
    {
      provide: 'CommentMapper',
      useClass: CommentMapperImpl,
    },

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
      provide: 'COMMENT_REPOSITORY',
      useClass: PrismaCommentRepository,
    },

    // Mock Services (temporary)
    {
      provide: 'USER_SERVICE',
      useClass: MockUserService,
    },
    {
      provide: 'POST_SERVICE',
      useClass: MockPostService,
    },
  ],
  exports: ['CommentApplicationService'],
})
export class CommentsModule {}
