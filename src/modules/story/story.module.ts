import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';

// Constants (DI Tokens)
import {
  STORY_REPOSITORY_TOKEN,
  STORY_VIEW_REPOSITORY_TOKEN,
} from './constants';

// Infrastructure Layer
import {
  StoryPrismaRepository,
  StoryViewPrismaRepository,
  StoryCleanupJob,
} from './infrastructure';

// Application Layer
import {
  CreateStoryUseCase,
  GetStoriesUseCase,
  ViewStoryUseCase,
  DeactivateExpiredStoriesUseCase,
  StoryApplicationService,
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
    DeactivateExpiredStoriesUseCase,

    // Application Service
    StoryApplicationService,

    // Infrastructure Jobs
    StoryCleanupJob,
  ],
  exports: [StoryApplicationService],
})
export class StoryModule {}
