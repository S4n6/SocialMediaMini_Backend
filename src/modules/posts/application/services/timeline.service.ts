import { Injectable, Inject } from '@nestjs/common';
import { PostEntity } from '../../domain/entities/post.entity';
import {
  ITimelineRepository,
  CursorPaginatedPosts,
} from '../../domain/repositories/timeline.repository';
import { TIMELINE_REPOSITORY_TOKEN } from '../../constants';

export type TimelineAlgorithm = 'chronological' | 'smart' | 'diversified';

@Injectable()
export class TimelineService {
  constructor(
    @Inject(TIMELINE_REPOSITORY_TOKEN)
    private readonly timelineRepository: ITimelineRepository,
  ) {}

  /**
   * Get timeline feed using specified algorithm with cursor pagination
   */
  async getTimelineFeed(
    userId: string,
    limit: number,
    cursor?: string | null,
    algorithm: TimelineAlgorithm = 'chronological',
  ): Promise<CursorPaginatedPosts> {
    switch (algorithm) {
      case 'smart':
        if (this.timelineRepository.getSmartTimelineFeed) {
          return this.timelineRepository.getSmartTimelineFeed(
            userId,
            limit,
            cursor,
          );
        }
        return this.timelineRepository.getTimelineFeed(userId, limit, cursor);

      case 'diversified':
        if (this.timelineRepository.getDiversifiedTimelineFeed) {
          return this.timelineRepository.getDiversifiedTimelineFeed(
            userId,
            limit,
            cursor,
          );
        }
        return this.timelineRepository.getTimelineFeed(userId, limit, cursor);

      case 'chronological':
      default:
        return this.timelineRepository.getTimelineFeed(userId, limit, cursor);
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
