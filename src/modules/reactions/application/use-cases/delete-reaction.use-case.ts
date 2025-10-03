import { Injectable } from '@nestjs/common';
import { ReactionRepository } from '../../domain/repositories/reaction.repository';
import { ReactionDomainService } from '../../domain/services/reaction-domain.service';

@Injectable()
export class DeleteReactionUseCase {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly reactionDomainService: ReactionDomainService,
  ) {}

  async execute(reactionId: string, userId: string): Promise<void> {
    await this.reactionDomainService.deleteReaction(reactionId, userId);
  }
}
