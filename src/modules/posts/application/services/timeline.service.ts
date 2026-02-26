import { Injectable, Inject } from '@nestjs/common';
import { PostEntity } from '../../domain/entities/post.entity';
import { ITimelineRepository } from '../../domain/repositories/timeline.repository';
import { TIMELINE_REPOSITORY_TOKEN } from '../../constants';

export type TimelineAlgorithm = 'chronological' | 'smart' | 'diversified';

@Injectable()
export class TimelineService {
  constructor(
    @Inject(TIMELINE_REPOSITORY_TOKEN)
    private readonly timelineRepository: ITimelineRepository,
  ) {}

  /**
   * Get timeline feed using specified algorithm
   */
  async getTimelineFeed(
    userId: string,
    page: number,
    limit: number,
    algorithm: TimelineAlgorithm = 'chronological',
  ): Promise<{ posts: PostEntity[]; total: number }> {
    switch (algorithm) {
      case 'smart':
        if (this.timelineRepository.getSmartTimelineFeed) {
          return this.timelineRepository.getSmartTimelineFeed(
            userId,
            page,
            limit,
          );
        }
        // Fallback to chronological
        return this.timelineRepository.getTimelineFeed(userId, page, limit);

      case 'diversified':
        if (this.timelineRepository.getDiversifiedTimelineFeed) {
          return this.timelineRepository.getDiversifiedTimelineFeed(
            userId,
            page,
            limit,
          );
        }
        // Fallback to chronological
        return this.timelineRepository.getTimelineFeed(userId, page, limit);

      case 'chronological':
      default:
        return this.timelineRepository.getTimelineFeed(userId, page, limit);
    }
  }

  /**
   * Get available timeline algorithms
   */
  getAvailableAlgorithms(): TimelineAlgorithm[] {
    const algorithms: TimelineAlgorithm[] = ['chronological'];

    if (this.timelineRepository.getSmartTimelineFeed) {
      algorithms.push('smart');
    }

    if (this.timelineRepository.getDiversifiedTimelineFeed) {
      algorithms.push('diversified');
    }

    return algorithms;
  }
}
