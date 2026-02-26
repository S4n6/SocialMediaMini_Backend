import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { PostMediasModule } from '../post-medias/postMedias.module';
import { RedisCacheModule } from '../cache/cache.module';

// Clean Architecture imports
import { PostApplicationService } from './application/post-application.service';

// Use Cases
import { CreatePostUseCase } from './application/use-cases/create-post.use-case';
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case';
import { DeletePostUseCase } from './application/use-cases/delete-post.use-case';
import { GetPostByIdUseCase } from './application/use-cases/get-post-by-id.use-case';
import { GetPostsUseCase } from './application/use-cases/get-posts.use-case';
import { GetTimelineFeedUseCase } from './application/use-cases/get-timeline-feed.use-case';

// Domain Layer
import { PostFactory } from './domain/factories/post.factory';
import { PostDomainService } from './domain/services/post-domain.service';

// Infrastructure Layer
import { PostPrismaRepository } from './infrastructure/persistence/repositories/post.prisma.repository';
import { AdvancedTimelineRepository } from './infrastructure/advanced-timeline.repository';
import { PostMapper } from './infrastructure/persistence/mappers/post.mapper';

// Services
import { TimelineService } from './application/services/timeline.service';
import { PostEnrichmentService } from './application/services/post-enrichment.service';

// Infrastructure Adapters
import { UserServiceAdapter } from './infrastructure/adapters/user-service.adapter';

// Event Handlers
import { PostEventHandler } from './application/events/post-event.handler';

// Presentation Layer
import { PostsController } from './presentation/posts.controller';

// DI Tokens
import {
  POST_REPOSITORY_TOKEN,
  TIMELINE_REPOSITORY_TOKEN,
  USER_ADAPTER_TOKEN,
} from './constants';

@Module({
  imports: [PrismaModule, PostMediasModule, RedisCacheModule],
  controllers: [PostsController],
  providers: [
    // Application Layer
    PostApplicationService,

    // Use Cases - Post Management
    CreatePostUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,

    // Use Cases - Post Retrieval
    GetPostByIdUseCase,
    GetPostsUseCase,
    GetTimelineFeedUseCase,

    // Domain Layer (pure TypeScript - registered as factory providers)
    {
      provide: PostDomainService,
      useFactory: () => new PostDomainService(),
    },
    {
      provide: PostFactory,
      useFactory: (domainService: PostDomainService) =>
        new PostFactory(domainService),
      inject: [PostDomainService],
    },

    // Services
    TimelineService,
    PostEnrichmentService,

    // Infrastructure - Mapper
    PostMapper,

    // Event Handlers
    PostEventHandler,

    // Infrastructure Adapters
    {
      provide: USER_ADAPTER_TOKEN,
      useClass: UserServiceAdapter,
    },

    // Infrastructure Layer - Repositories
    {
      provide: POST_REPOSITORY_TOKEN,
      useClass: PostPrismaRepository,
    },
    {
      provide: TIMELINE_REPOSITORY_TOKEN,
      useClass: AdvancedTimelineRepository, // Use advanced algorithms
      // Alternative: useClass: PostPrismaRepository, // Use basic chronological
    },
    // Reaction/comment repositories are provided by their respective modules.
  ],
  exports: [
    PostApplicationService,
    POST_REPOSITORY_TOKEN,
    TIMELINE_REPOSITORY_TOKEN,
    TimelineService,
    PostFactory,
    PostDomainService,
  ],
})
export class PostsModule {}
