import { Injectable, Inject } from '@nestjs/common';
import { ReactionRepository, PostNotFoundException } from '../../domain';
import { ReactionStatusResponseDto } from '../dto/reaction-response.dto';
import { ReactionMapper } from '../mappers/reaction.mapper';
import { ExternalPostService } from '../interfaces/external-services.interface';
import { EXTERNAL_POST_SERVICE } from '../../constants';

@Injectable()
export class GetReactionStatusUseCase {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    @Inject(EXTERNAL_POST_SERVICE)
    private readonly postService: ExternalPostService,
  ) {}

  async execute(
    postId: string,
    userId: string,
  ): Promise<ReactionStatusResponseDto> {
    // Validate post exists
    const post = await this.postService.findById(postId);
    if (!post) {
      throw new PostNotFoundException(postId);
    }

    const result = await this.reactionRepository.getReactionStatus(
      postId,
      userId,
      'post',
    );
    return ReactionMapper.toReactionStatusResponseDto(result);
  }
}
