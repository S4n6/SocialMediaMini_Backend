import { StoryViewEntity } from '../entities';

export interface IStoryViewRepository {
  /**
   * Smart save — INSERT or UPDATE (upsert pattern)
   */
  save(storyView: StoryViewEntity): Promise<void>;

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
   * Batch: count views for multiple stories at once
   */
  countViewsByStoryIds(storyIds: string[]): Promise<Map<string, number>>;

  /**
   * Batch: find which stories a user has already viewed
   */
  findViewedStoryIds(
    storyIds: string[],
    viewerId: string,
  ): Promise<Set<string>>;
}
