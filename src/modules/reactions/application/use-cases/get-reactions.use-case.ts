import { Injectable } from '@nestjs/common';
import { ReactionRepository } from '../../domain/repositories/reaction.repository';
import { GetReactionsQuery } from '../dto/reaction.dto';
import { ReactionResponseDto } from '../dto/reaction-response.dto';
import { ReactionMapper } from '../mappers/reaction.mapper';

@Injectable()
export class GetReactionsUseCase {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async execute(query?: GetReactionsQuery): Promise<ReactionResponseDto[]> {
    const reactions = await this.reactionRepository.findAll({
      postId: query?.postId,
      commentId: query?.commentId,
      reactorId: query?.reactorId,
      targetType: query?.targetType,
    });

    return ReactionMapper.toResponseDtoArray(reactions);
  }
}
