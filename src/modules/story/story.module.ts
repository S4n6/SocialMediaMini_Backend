import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

// Constants & Tokens
import { STORY_REPOSITORY_TOKEN, STORY_VIEW_REPOSITORY_TOKEN } from './tokens';

// Infrastructure Layer
import {
  StoryPrismaRepository,
  StoryViewPrismaRepository,
} from './infrastructure/repositories';

// Application Layer
import {
  CreateStoryUseCase,
  GetStoriesUseCase,
  ViewStoryUseCase,
  StoryApplicationService,
  StoryCleanupJob,
} from './application';

// Presentation Layer
import { StoryController } from './presentation';

@Module({
  imports: [PrismaModule],
  controllers: [StoryController],
  providers: [
    // Repository Implementations
    {
      provide: STORY_REPOSITORY_TOKEN,
      useClass: StoryPrismaRepository,
    },
    {
      provide: STORY_VIEW_REPOSITORY_TOKEN,
      useClass: StoryViewPrismaRepository,
    },

    // Use Cases
    CreateStoryUseCase,
    GetStoriesUseCase,
    ViewStoryUseCase,

    // Application Service
    StoryApplicationService,

    // Scheduled Jobs
    StoryCleanupJob,
  ],
  exports: [
    StoryApplicationService,
    STORY_REPOSITORY_TOKEN,
    STORY_VIEW_REPOSITORY_TOKEN,
  ],
})
export class StoryModule {}
