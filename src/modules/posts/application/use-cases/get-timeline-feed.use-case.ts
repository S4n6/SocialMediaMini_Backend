import { Injectable } from '@nestjs/common';
import { PostListResponseDto } from '../dto/post.dto';
import {
  TimelineService,
  TimelineAlgorithm,
} from '../services/timeline.service';
import { mapPostToResponseDto } from '../mappers/post-response.mapper';

/**
 * Use case for getting user's timeline feed
 */
@Injectable()
export class GetTimelineFeedUseCase {
  constructor(private readonly timelineService: TimelineService) {}

  async execute(
    userId: string,
    page: number = 1,
    limit: number = 10,
    algorithm: TimelineAlgorithm = 'chronological',
  ): Promise<PostListResponseDto> {
    const { posts, total } = await this.timelineService.getTimelineFeed(
      userId,
      page,
      limit,
      algorithm,
    );

    const postDtos = posts.map(mapPostToResponseDto);
    const totalPages = Math.ceil(total / limit);

    return {
      posts: postDtos,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}
