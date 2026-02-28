import { StoryEntity } from '../entities';

export interface IStoryRepository {
  /**
   * Smart save — INSERT or UPDATE (upsert pattern)
   */
  save(story: StoryEntity): Promise<void>;

  /**
   * Find story by ID
   */
  findById(id: string): Promise<StoryEntity | null>;

  /**
   * Find all active (non-expired) stories by user ID
   */
  findActiveByUserId(userId: string): Promise<StoryEntity[]>;

  /**
   * Find all active stories from users that the current user follows
   */
  findActiveFromFollowedUsers(currentUserId: string): Promise<StoryEntity[]>;

  /**
   * Delete story by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Find stories that are still marked active but have expired
   */
  findExpiredActiveStories(): Promise<StoryEntity[]>;
}
