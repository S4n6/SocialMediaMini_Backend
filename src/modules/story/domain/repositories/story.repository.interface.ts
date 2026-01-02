import { StoryEntity } from '../entities';

export interface IStoryRepository {
  /**
   * Create a new story
   */
  create(story: StoryEntity): Promise<StoryEntity>;

  /**
   * Find story by ID
   */
  findById(id: string): Promise<StoryEntity | null>;

  /**
   * Find all active stories by user ID
   */
  findActiveByUserId(userId: string): Promise<StoryEntity[]>;

  /**
   * Find all active stories from users that the current user follows
   */
  findActiveFromFollowedUsers(currentUserId: string): Promise<StoryEntity[]>;

  /**
   * Update story
   */
  update(id: string, updates: Partial<StoryEntity>): Promise<StoryEntity>;

  /**
   * Delete story by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Find expired stories
   */
  findExpiredStories(): Promise<StoryEntity[]>;

  /**
   * Deactivate expired stories
   */
  deactivateExpiredStories(): Promise<void>;
}
