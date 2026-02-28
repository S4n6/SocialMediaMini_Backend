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
} from '../../constants';
import { StoryEntity } from '../../domain/entities';

/**
 * Get Stories Use Case
 *
 * Uses batch view queries to avoid N+1 problems.
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
    const stories = await this.storyRepository.findActiveFromFollowedUsers(
      query.currentUserId,
    );

    const items = await this.enrichWithViewData(stories, query.currentUserId);

    return { items, total: items.length };
  }

  /**
   * Get stories from a specific user
   */
  async getUserStories(query: GetUserStoriesQuery): Promise<StoriesListResult> {
    const stories = await this.storyRepository.findActiveByUserId(query.userId);

    const items = await this.enrichWithViewData(stories, query.currentUserId);

    return { items, total: items.length };
  }

  /**
   * Batch-enrich stories with view counts and viewed status.
   * Uses two batch queries instead of 2×N individual queries.
   */
  private async enrichWithViewData(
    stories: StoryEntity[],
    currentUserId?: string,
  ): Promise<StoryUseCaseResult[]> {
    if (stories.length === 0) return [];

    const storyIds = stories.map((s) => s.id);

    // Two batch queries instead of N+1
    const [viewCountsMap, viewedIdsSet] = await Promise.all([
      this.storyViewRepository.countViewsByStoryIds(storyIds),
      currentUserId
        ? this.storyViewRepository.findViewedStoryIds(storyIds, currentUserId)
        : Promise.resolve(new Set<string>()),
    ]);

    return stories.map((story) => ({
      id: story.id,
      authorId: story.authorId,
      content: story.content || undefined,
      mediaUrl: story.mediaUrl || undefined,
      mediaType: story.mediaType || undefined,
      expiresAt: story.expiresAt,
      isActive: story.isActive,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      viewCount: viewCountsMap.get(story.id) ?? 0,
      hasViewed: viewedIdsSet.has(story.id),
    }));
  }
}
