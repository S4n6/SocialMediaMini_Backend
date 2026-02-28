import { Injectable } from '@nestjs/common';
import { CursorPaginatedPostsResponseDto } from '../dto/post.dto';
import {
  TimelineService,
  TimelineAlgorithm,
} from '../services/timeline.service';
import { mapPostToResponseDto } from '../mappers/post-response.mapper';

/**
 * Use case for getting user's timeline feed with cursor-based pagination
 */
@Injectable()
export class GetTimelineFeedUseCase {
  constructor(private readonly timelineService: TimelineService) {}

  async execute(
    userId: string,
    limit: number = 10,
    cursor?: string | null,
    algorithm: TimelineAlgorithm = 'chronological',
  ): Promise<CursorPaginatedPostsResponseDto> {
    const { posts, nextCursor } = await this.timelineService.getTimelineFeed(
      userId,
      limit,
      cursor,
      algorithm,
    );

    const postDtos = posts.map(mapPostToResponseDto);

    return {
      data: postDtos,
      nextCursor,
      hasNextPage: nextCursor !== null,
    };
  }
}
