import { Injectable } from '@nestjs/common';
import { CreateReactionDto, GetReactionsQuery } from './dto/reaction.dto';
import {
  CreateReactionResponseDto,
  ReactionResponseDto,
  PostReactionsResponseDto,
  ReactionStatusResponseDto,
} from './dto/reaction-response.dto';
import { CreateReactionUseCase } from './use-cases/create-reaction.use-case';
import { DeleteReactionUseCase } from './use-cases/delete-reaction.use-case';
import { GetReactionUseCase } from './use-cases/get-reaction.use-case';
import { GetReactionsUseCase } from './use-cases/get-reactions.use-case';
import { GetPostReactionsUseCase } from './use-cases/get-post-reactions.use-case';
import { GetReactionStatusUseCase } from './use-cases/get-reaction-status.use-case';

@Injectable()
export class ReactionApplicationService {
  constructor(
    private readonly createReactionUseCase: CreateReactionUseCase,
    private readonly deleteReactionUseCase: DeleteReactionUseCase,
    private readonly getReactionUseCase: GetReactionUseCase,
    private readonly getReactionsUseCase: GetReactionsUseCase,
    private readonly getPostReactionsUseCase: GetPostReactionsUseCase,
    private readonly getReactionStatusUseCase: GetReactionStatusUseCase,
  ) {}

  async createReaction(
    dto: CreateReactionDto,
    userId: string,
  ): Promise<CreateReactionResponseDto> {
    return this.createReactionUseCase.execute(dto, userId);
  }

  async deleteReaction(
    reactionId: string,
    userId: string,
  ): Promise<{ message: string }> {
    await this.deleteReactionUseCase.execute(reactionId, userId);
    return { message: 'Reaction deleted successfully' };
  }

  async getReaction(reactionId: string): Promise<ReactionResponseDto> {
    return this.getReactionUseCase.execute(reactionId);
  }

  async getReactions(
    query?: GetReactionsQuery,
  ): Promise<ReactionResponseDto[]> {
    return this.getReactionsUseCase.execute(query);
  }

  async getPostReactions(postId: string): Promise<PostReactionsResponseDto> {
    return this.getPostReactionsUseCase.execute(postId);
  }

  async getReactionStatus(
    postId: string,
    userId: string,
  ): Promise<ReactionStatusResponseDto> {
    return this.getReactionStatusUseCase.execute(postId, userId);
  }
}
