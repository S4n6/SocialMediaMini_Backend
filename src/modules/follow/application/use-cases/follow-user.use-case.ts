import { Injectable, Inject } from '@nestjs/common';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { FollowDomainService } from '../../domain/services/follow-domain.service';
import { FollowUserDto } from '../dto/follow.dto';
import { FollowUserResponseDto } from '../dto/follow-response.dto';
import { FollowMapper } from '../mappers/follow.mapper';
import { FollowEnrichmentService } from '../services/follow-enrichment.service';
import { NotificationService } from '../interfaces/external-services.interface';
import { FOLLOW_MODULE_TOKENS } from '../../constants';
import { UserNotFoundException } from '../../domain/follow.exceptions';

@Injectable()
export class FollowUserUseCase {
  constructor(
    @Inject(FOLLOW_MODULE_TOKENS.FOLLOW_REPOSITORY)
    private readonly followRepository: FollowRepository,
    private readonly followEnrichmentService: FollowEnrichmentService,
    @Inject(FOLLOW_MODULE_TOKENS.NOTIFICATION_SERVICE)
    private readonly notificationService: NotificationService,
  ) {}

  async execute(
    dto: FollowUserDto,
    followerId: string,
  ): Promise<FollowUserResponseDto> {
    const { userId: followingId } = dto;

    // Validate target user exists using enrichment service
    try {
      await this.followEnrichmentService.validateUserExists(followingId);
    } catch (error) {
      throw new UserNotFoundException(followingId);
    }

    // Check if already following using domain service
    const existingFollow =
      await this.followRepository.findByFollowerAndFollowing(
        followerId,
        followingId,
      );
    FollowDomainService.validateNotAlreadyFollowing(existingFollow);

    // Create follow entity using domain service
    const followEntity = FollowDomainService.createFollowEntity(
      followerId,
      followingId,
    );

    // Save to repository
    const savedFollow = await this.followRepository.save(followEntity);

    // Get follower info for notification
    const followerUser =
      await this.followEnrichmentService.validateUserExists(followerId);

    // Send notification (don't fail if notification fails)
    try {
      await this.notificationService.createFollowNotification({
        followerId,
        followingId,
        followerUserName: followerUser.username,
      });
    } catch (error) {
      console.error('Failed to create follow notification:', error);
    }

    return {
      message: 'User followed successfully',
      follow: FollowMapper.toResponseDto(savedFollow),
    };
  }
}
