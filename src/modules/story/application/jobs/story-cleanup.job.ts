import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IStoryRepository } from '../../domain/repositories';
import { STORY_REPOSITORY_TOKEN } from '../../tokens';

/**
 * Story Cleanup Job
 *
 * Responsibility: Clean up expired stories periodically
 * - Runs every hour to check for expired stories
 * - Deactivates expired stories instead of deleting them
 * - Logs cleanup results
 */
@Injectable()
export class StoryCleanupJob {
  private readonly logger = new Logger(StoryCleanupJob.name);

  constructor(
    @Inject(STORY_REPOSITORY_TOKEN)
    private readonly storyRepository: IStoryRepository,
  ) {}

  /**
   * Run cleanup job every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleStoryCleanup(): Promise<void> {
    this.logger.log('Starting story cleanup job...');

    try {
      // Find expired stories
      const expiredStories = await this.storyRepository.findExpiredStories();

      if (expiredStories.length === 0) {
        this.logger.log('No expired stories found');
        return;
      }

      this.logger.log(`Found ${expiredStories.length} expired stories`);

      // Deactivate expired stories
      await this.storyRepository.deactivateExpiredStories();

      this.logger.log(
        `Successfully deactivated ${expiredStories.length} expired stories`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup expired stories', error);
    }
  }

  /**
   * Manual cleanup method for testing or admin purposes
   */
  async runManualCleanup(): Promise<{ deactivatedCount: number }> {
    this.logger.log('Running manual story cleanup...');

    try {
      const expiredStories = await this.storyRepository.findExpiredStories();
      await this.storyRepository.deactivateExpiredStories();

      this.logger.log(
        `Manual cleanup completed: ${expiredStories.length} stories deactivated`,
      );

      return { deactivatedCount: expiredStories.length };
    } catch (error) {
      this.logger.error('Manual cleanup failed', error);
      throw error;
    }
  }
}
