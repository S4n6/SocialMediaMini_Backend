import { Injectable, Inject } from '@nestjs/common';
import {
  IReactionRepository,
  ReactionNotFoundException,
  UnauthorizedReactionException,
} from '../../domain';
import { REACTION_REPOSITORY_TOKEN } from '../../constants';

@Injectable()
export class DeleteReactionUseCase {
  constructor(
    @Inject(REACTION_REPOSITORY_TOKEN)
    private readonly reactionRepository: IReactionRepository,
  ) {}

  async execute(reactionId: string, userId: string): Promise<void> {
    const reaction = await this.reactionRepository.findById(reactionId);

    if (!reaction) {
      throw new ReactionNotFoundException(reactionId);
    }

    if (!reaction.isOwnedBy(userId)) {
      throw new UnauthorizedReactionException();
    }

    reaction.markForRemoval();
    await this.reactionRepository.delete(reactionId);
  }
}
