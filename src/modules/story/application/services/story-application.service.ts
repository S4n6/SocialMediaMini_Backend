import { Injectable } from '@nestjs/common';
import {
  CreateStoryUseCase,
  GetStoriesUseCase,
  ViewStoryUseCase,
  DeactivateExpiredStoriesUseCase,
} from '../use-cases';
import {
  CreateStoryCommand,
  GetFollowedUsersStoriesQuery,
  GetUserStoriesQuery,
  ViewStoryCommand,
  StoryUseCaseResult,
  StoriesListResult,
} from '../dto';

/**
 * Story Application Service
 *
 * Thin orchestrator — delegates to individual use cases.
 */
@Injectable()
export class StoryApplicationService {
  constructor(
    private readonly createStoryUseCase: CreateStoryUseCase,
    private readonly getStoriesUseCase: GetStoriesUseCase,
    private readonly viewStoryUseCase: ViewStoryUseCase,
    private readonly deactivateExpiredStoriesUseCase: DeactivateExpiredStoriesUseCase,
  ) {}

  async createStory(command: CreateStoryCommand): Promise<StoryUseCaseResult> {
    return this.createStoryUseCase.execute(command);
  }

  async getFollowedUsersStories(
    query: GetFollowedUsersStoriesQuery,
  ): Promise<StoriesListResult> {
    return this.getStoriesUseCase.getFollowedUsersStories(query);
  }

  async getUserStories(query: GetUserStoriesQuery): Promise<StoriesListResult> {
    return this.getStoriesUseCase.getUserStories(query);
  }

  async viewStory(command: ViewStoryCommand): Promise<StoryUseCaseResult> {
    return this.viewStoryUseCase.execute(command);
  }

  async deactivateExpiredStories(): Promise<number> {
    return this.deactivateExpiredStoriesUseCase.execute();
  }
}
