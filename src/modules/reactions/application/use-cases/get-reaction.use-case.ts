import { Injectable, Inject } from '@nestjs/common';
import { IReactionRepository, ReactionNotFoundException } from '../../domain';
import { ReactionResponseDto } from '../dto/reaction-response.dto';
import { ReactionMapper } from '../mappers/reaction.mapper';
import { REACTION_REPOSITORY_TOKEN } from '../../constants';

@Injectable()
export class GetReactionUseCase {
  constructor(
    @Inject(REACTION_REPOSITORY_TOKEN)
    private readonly reactionRepository: IReactionRepository,
  ) {}

  async execute(reactionId: string): Promise<ReactionResponseDto> {
    const reaction = await this.reactionRepository.findById(reactionId);

    if (!reaction) {
      throw new ReactionNotFoundException(reactionId);
    }

    return ReactionMapper.toResponseDto(reaction);
  }
}
