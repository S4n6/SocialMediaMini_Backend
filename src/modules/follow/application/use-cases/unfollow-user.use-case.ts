import { Injectable, Inject } from '@nestjs/common';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { FollowDomainService } from '../../domain/services/follow-domain.service';
import { FOLLOW_MODULE_TOKENS } from '../../constants';

@Injectable()
export class UnfollowUserUseCase {
  constructor(
    @Inject(FOLLOW_MODULE_TOKENS.FOLLOW_REPOSITORY)
    private readonly followRepository: FollowRepository,
  ) {}

  async execute(followingId: string, followerId: string): Promise<void> {
    // Validate unfollow operation
    FollowDomainService.validateUnfollow(followerId, followingId);

    // Find existing follow relationship
    const existingFollow =
      await this.followRepository.findByFollowerAndFollowing(
        followerId,
        followingId,
      );

    // Validate currently following
    FollowDomainService.validateCurrentlyFollowing(existingFollow);

    // Delete the follow relationship
    await this.followRepository.delete(existingFollow!.id);
  }
}
