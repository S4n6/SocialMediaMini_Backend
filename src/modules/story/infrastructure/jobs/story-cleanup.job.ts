import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DeactivateExpiredStoriesUseCase } from '../../application/use-cases';

/**
 * Story Cleanup Job (Infrastructure concern — scheduling)
 *
 * Delegates actual business logic to the application-layer use case.
 * Only owns the "when" (every hour), not the "what".
 */
@Injectable()
export class StoryCleanupJob {
  private readonly logger = new Logger(StoryCleanupJob.name);

  constructor(
    private readonly deactivateExpiredStoriesUseCase: DeactivateExpiredStoriesUseCase,
  ) {}

  /**
   * Run cleanup every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleStoryCleanup(): Promise<void> {
    this.logger.log('Starting story cleanup job...');

    try {
      const count = await this.deactivateExpiredStoriesUseCase.execute();

      if (count === 0) {
        this.logger.log('No expired stories found');
      } else {
        this.logger.log(
          `Story cleanup completed: ${count} stories deactivated`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired stories', error);
    }
  }
}
