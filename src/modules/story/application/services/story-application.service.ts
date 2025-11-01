import { Injectable } from '@nestjs/common';
import {
  CreateStoryUseCase,
  GetStoriesUseCase,
  ViewStoryUseCase,
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
 * Responsibility: Orchestrate story-related use cases
 * - Provide high-level API for story operations
 * - Handle cross-cutting concerns (logging, validation, events)
 * - Coordinate multiple use cases if needed
 */
@Injectable()
export class StoryApplicationService {
  constructor(
    private readonly createStoryUseCase: CreateStoryUseCase,
    private readonly getStoriesUseCase: GetStoriesUseCase,
    private readonly viewStoryUseCase: ViewStoryUseCase,
  ) {}

  /**
   * Create a new story
   */
  async createStory(command: CreateStoryCommand): Promise<StoryUseCaseResult> {
    return this.createStoryUseCase.execute(command);
  }

  /**
   * Get stories from followed users (main feed)
   */
  async getFollowedUsersStories(
    query: GetFollowedUsersStoriesQuery,
  ): Promise<StoriesListResult> {
    return this.getStoriesUseCase.getFollowedUsersStories(query);
  }

  /**
   * Get stories from a specific user
   */
  async getUserStories(query: GetUserStoriesQuery): Promise<StoriesListResult> {
    return this.getStoriesUseCase.getUserStories(query);
  }

  /**
   * View a story and track the view
   */
  async viewStory(command: ViewStoryCommand): Promise<StoryUseCaseResult> {
    return this.viewStoryUseCase.execute(command);
  }
}
