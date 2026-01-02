import { StoryViewEntity } from '../entities';

export interface IStoryViewRepository {
  /**
   * Create a new story view
   */
  create(storyView: StoryViewEntity): Promise<StoryViewEntity>;

  /**
   * Find story view by story ID and viewer ID
   */
  findByStoryAndViewer(
    storyId: string,
    viewerId: string,
  ): Promise<StoryViewEntity | null>;

  /**
   * Get all viewers of a story
   */
  findViewersByStoryId(storyId: string): Promise<StoryViewEntity[]>;

  /**
   * Count total views of a story
   */
  countViewsByStoryId(storyId: string): Promise<number>;

  /**
   * Check if user has viewed a story
   */
  hasUserViewedStory(storyId: string, viewerId: string): Promise<boolean>;
}
