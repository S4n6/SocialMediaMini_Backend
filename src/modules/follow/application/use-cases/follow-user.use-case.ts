import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { FollowDomainService } from '../../domain/services/follow-domain.service';
import { UserFollowedEvent } from '../../domain/events/follow.events';
import { FollowUserDto } from '../dto/follow.dto';
import { FollowUserResponseDto } from '../dto/follow-response.dto';
import { FollowMapper } from '../mappers/follow.mapper';
import { FollowEnrichmentService } from '../services/follow-enrichment.service';
import { FOLLOW_REPOSITORY_TOKEN } from '../../constants';
import { UserNotFoundException } from '../../domain/follow.exceptions';

@Injectable()
export class FollowUserUseCase {
  constructor(
    @Inject(FOLLOW_REPOSITORY_TOKEN)
    private readonly followRepository: FollowRepository,
    private readonly followEnrichmentService: FollowEnrichmentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    dto: FollowUserDto,
    followerId: string,
  ): Promise<FollowUserResponseDto> {
    const { userId: followingId } = dto;

    // 1. Validate target user exists
    let followingUser;
    try {
      followingUser =
        await this.followEnrichmentService.validateUserExists(followingId);
    } catch {
      throw new UserNotFoundException(followingId);
    }

    // 2. Check if already following (domain validation)
    const existingFollow =
      await this.followRepository.findByFollowerAndFollowing(
        followerId,
        followingId,
      );
    FollowDomainService.validateNotAlreadyFollowing(
      existingFollow,
      followerId,
      followingId,
    );

    // 3. Create follow entity via domain service
    const followEntity = FollowDomainService.createFollowEntity(
      followerId,
      followingId,
    );

    // 4. Persist
    const savedFollow = await this.followRepository.save(followEntity);

    // 5. Get follower info for event
    const followerUser =
      await this.followEnrichmentService.validateUserExists(followerId);

    // 6. Emit domain event (side effects handled by subscribers)
    this.eventEmitter.emit(
      'follow.user.followed',
      new UserFollowedEvent(
        savedFollow.id,
        followerId,
        followingId,
        followerUser.username,
        followingUser.username,
      ),
    );

    return {
      message: 'User followed successfully',
      follow: FollowMapper.toResponseDto(savedFollow),
    };
  }
}
