import { Injectable } from '@nestjs/common';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { FollowDomainService } from '../../domain/services/follow-domain.service';

@Injectable()
export class UnfollowUserUseCase {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly followDomainService: FollowDomainService,
  ) {}

  async execute(followingId: string, followerId: string): Promise<void> {
    await this.followDomainService.removeFollow(followerId, followingId);
  }
}
