import { Injectable, Inject } from '@nestjs/common';
import { IStoryRepository } from '../../domain/repositories';
import { STORY_REPOSITORY_TOKEN } from '../../constants';

/**
 * Deactivate Expired Stories Use Case
 *
 * Loads expired-but-still-active stories, applies the domain
 * method `markExpired()`, then persists each one.
 * Called by the infrastructure-level StoryCleanupJob.
 *
 * @returns number of stories deactivated
 */
@Injectable()
export class DeactivateExpiredStoriesUseCase {
  constructor(
    @Inject(STORY_REPOSITORY_TOKEN)
    private readonly storyRepository: IStoryRepository,
  ) {}

  async execute(): Promise<number> {
    const expiredStories =
      await this.storyRepository.findExpiredActiveStories();

    if (expiredStories.length === 0) {
      return 0;
    }

    for (const story of expiredStories) {
      const deactivated = story.markExpired();
      await this.storyRepository.save(deactivated);
    }

    return expiredStories.length;
  }
}
