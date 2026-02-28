import { Injectable, Inject } from '@nestjs/common';
import { IReactionRepository } from '../../domain';
import { GetReactionsQuery } from '../dto/reaction.dto';
import { ReactionResponseDto } from '../dto/reaction-response.dto';
import { ReactionMapper } from '../mappers/reaction.mapper';
import { REACTION_REPOSITORY_TOKEN } from '../../constants';

@Injectable()
export class GetReactionsUseCase {
  constructor(
    @Inject(REACTION_REPOSITORY_TOKEN)
    private readonly reactionRepository: IReactionRepository,
  ) {}

  async execute(query?: GetReactionsQuery): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.findAll({
      postId: query?.postId,
      commentId: query?.commentId,
      reactorId: query?.reactorId,
      targetType: query?.targetType,
      limit: query?.limit,
      offset: query?.offset,
    });

    return ReactionMapper.toResponseDtoArray(reactions);
  }
}
