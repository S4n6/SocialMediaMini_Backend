import { Injectable, Inject } from '@nestjs/common';
import { ReactionRepository } from '../../domain/repositories/reaction.repository';
import { PostReactionsResponseDto } from '../dto/reaction-response.dto';
import { ReactionMapper } from '../mappers/reaction.mapper';
import { ExternalPostService } from '../interfaces/external-services.interface';
import { EXTERNAL_POST_SERVICE } from '../interfaces/tokens';
import { PostNotFoundException } from '../../domain/reaction.exceptions';

@Injectable()
export class GetPostReactionsUseCase {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    @Inject(EXTERNAL_POST_SERVICE)
    private readonly postService: ExternalPostService,
  ) {}

  async execute(postId: string): Promise<PostReactionsResponseDto> {
    // Validate post exists
    const post = await this.postService.findById(postId);
    if (!post) {
      throw new PostNotFoundException(postId);
    }

    const result = await this.reactionRepository.getPostReactions(postId);
    return ReactionMapper.toPostReactionsResponseDto(result);
  }
}
