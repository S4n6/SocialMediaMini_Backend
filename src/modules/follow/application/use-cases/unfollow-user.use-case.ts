import { Injectable, Inject } from '@nestjs/common';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { FollowDomainService } from '../../domain/services/follow-domain.service';
import { FOLLOW_REPOSITORY_TOKEN } from '../../constants';

@Injectable()
export class UnfollowUserUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY_TOKEN)
    private readonly followRepository: FollowRepository,
  ) { }

  async execute(followingId: string, followerId: string): Promise<void> {
    // 1. Domain validation
    FollowDomainService.validateUnfollow(followerId, followingId);

    // 2. Find existing follow relationship
    const existingFollow =
      await this.followRepository.findByFollowerAndFollowing(
        followerId,
        followingId,
      );

    // 3. Validate currently following
    FollowDomainService.validateCurrentlyFollowing(existingFollow);

    // 4. Delete the follow relationship
    await this.followRepository.delete(existingFollow!.id);

  }
}
