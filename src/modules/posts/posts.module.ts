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
import {
  GetPostByIdUseCase,
  GetPostsUseCase,
  GetTimelineFeedUseCase,
} from './application/use-cases/get-post.use-case';

// Domain Layer
import { PostFactory } from './domain/factories/post.factory';
import { PostDomainService } from './domain/services/post-domain.service';

// Infrastructure Layer
import { PostPrismaRepository } from './infrastructure/post.prisma.repository';
import { AdvancedTimelineRepository } from './infrastructure/advanced-timeline.repository';

// Services
import { TimelineService } from './application/services/timeline.service';

// Presentation Layer
import { PostsController } from './presentation/posts.controller';

// Repository interface tokens
import { POST_REPOSITORY_TOKEN } from './constants';
import { TIMELINE_REPOSITORY_TOKEN } from './application/interfaces/timeline-repository.interface';

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

    // Domain Layer
    PostFactory,
    PostDomainService,

    // Services
    TimelineService,

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
