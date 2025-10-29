import { Injectable } from '@nestjs/common';
import { ReactionRepository, ReactionNotFoundException } from '../../domain';
import { ReactionResponseDto } from '../dto/reaction-response.dto';
import { ReactionMapper } from '../mappers/reaction.mapper';

@Injectable()
export class GetReactionUseCase {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async execute(reactionId: string): Promise<ReactionResponseDto> {
    const reaction = await this.reactionRepository.findById(reactionId);

    if (!reaction) {
      throw new ReactionNotFoundException(reactionId);
    }

    return ReactionMapper.toResponseDto(reaction);
  }
}
