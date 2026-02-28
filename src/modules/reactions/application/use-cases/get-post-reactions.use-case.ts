import { Injectable, Inject } from '@nestjs/common';
import { IReactionRepository, PostNotFoundException } from '../../domain';
import { PostReactionsResponseDto } from '../dto/reaction-response.dto';
import { ReactionMapper } from '../mappers/reaction.mapper';
import { IExternalPostService } from '../ports/i-external-services';
import {
  REACTION_REPOSITORY_TOKEN,
  EXTERNAL_POST_SERVICE_TOKEN,
} from '../../constants';

@Injectable()
export class GetPostReactionsUseCase {
  constructor(
    @Inject(REACTION_REPOSITORY_TOKEN)
    private readonly reactionRepository: IReactionRepository,
    @Inject(EXTERNAL_POST_SERVICE_TOKEN)
    private readonly postService: IExternalPostService,
  ) {}

  async execute(postId: string): Promise<PostReactionsResponseDto> {
    const post = await this.postService.findById(postId);
    if (!post) {
      throw new PostNotFoundException(postId);
    }

    const result = await this.reactionRepository.getPostReactions(postId);
    return ReactionMapper.toPostReactionsResponseDto(result);
  }
}
