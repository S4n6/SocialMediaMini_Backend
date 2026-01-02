import { Injectable, Inject } from '@nestjs/common';
import {
  IStoryRepository,
  IStoryViewRepository,
} from '../../domain/repositories';
import {
  GetFollowedUsersStoriesQuery,
  GetUserStoriesQuery,
  StoriesListResult,
  StoryUseCaseResult,
} from '../dto';
import {
  STORY_REPOSITORY_TOKEN,
  STORY_VIEW_REPOSITORY_TOKEN,
} from '../../tokens';
import { StoryEntity } from '../../domain/entities';

/**
 * Get Stories Use Case
 *
 * Responsibility: Retrieve stories based on different criteria
 * - Get stories from followed users (feed)
 * - Get stories from specific user
 * - Include view counts and user interaction data
 */
@Injectable()
export class GetStoriesUseCase {
  constructor(
    @Inject(STORY_REPOSITORY_TOKEN)
    private readonly storyRepository: IStoryRepository,
    @Inject(STORY_VIEW_REPOSITORY_TOKEN)
    private readonly storyViewRepository: IStoryViewRepository,
  ) {}

  /**
   * Get stories from users that current user follows (main feed)
   */
  async getFollowedUsersStories(
    query: GetFollowedUsersStoriesQuery,
  ): Promise<StoriesListResult> {
    // Get stories from followed users
    const stories = await this.storyRepository.findActiveFromFollowedUsers(
      query.currentUserId,
    );

    // Map to results with view counts and interaction data
    const items = await Promise.all(
      stories.map((story) =>
        this.mapToResultWithViewData(story, query.currentUserId),
      ),
    );

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Get stories from a specific user
   */
  async getUserStories(query: GetUserStoriesQuery): Promise<StoriesListResult> {
    // Get user's stories
    const stories = await this.storyRepository.findActiveByUserId(query.userId);

    // Map to results with view counts and interaction data
    const items = await Promise.all(
      stories.map((story) =>
        this.mapToResultWithViewData(story, query.currentUserId),
      ),
    );

    return {
      items,
      total: items.length,
    };
  }

  /**
   * Map story entity to result with view data
   */
  private async mapToResultWithViewData(
    story: StoryEntity,
    currentUserId?: string,
  ): Promise<StoryUseCaseResult> {
    // Get view count
    const viewCount = await this.storyViewRepository.countViewsByStoryId(
      story.id,
    );

    // Check if current user has viewed this story
    let hasViewed = false;
    if (currentUserId) {
      hasViewed = await this.storyViewRepository.hasUserViewedStory(
        story.id,
        currentUserId,
      );
    }

    return {
      id: story.id,
      authorId: story.authorId,
      content: story.content || undefined,
      mediaUrl: story.mediaUrl || undefined,
      mediaType: story.mediaType || undefined,
      expiresAt: story.expiresAt,
      isActive: story.isActive,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      viewCount,
      hasViewed,
    };
  }
}
