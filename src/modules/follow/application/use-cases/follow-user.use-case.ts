import { Injectable, Inject } from '@nestjs/common';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { FollowDomainService } from '../../domain/services/follow-domain.service';
import { FollowUserDto } from '../dto/follow.dto';
import { FollowUserResponseDto } from '../dto/follow-response.dto';
import { FollowMapper } from '../mappers/follow.mapper';
import {
  ExternalUserService,
  NotificationService,
} from '../interfaces/external-services.interface';
import {
  EXTERNAL_USER_SERVICE,
  NOTIFICATION_SERVICE,
} from '../interfaces/tokens';
import { UserNotFoundException } from '../../domain/follow.exceptions';

@Injectable()
export class FollowUserUseCase {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly followDomainService: FollowDomainService,
    @Inject(EXTERNAL_USER_SERVICE)
    private readonly userService: ExternalUserService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: NotificationService,
  ) {}

  async execute(
    dto: FollowUserDto,
    followerId: string,
  ): Promise<FollowUserResponseDto> {
    const { userId: followingId } = dto;

    // Validate target user exists
    const targetUser = await this.userService.findById(followingId);
    if (!targetUser) {
      throw new UserNotFoundException(followingId);
    }

    // Create follow relationship
    const follow = await this.followDomainService.createFollow(
      followerId,
      followingId,
    );

    // Get follower info for notification
    const followerUser = await this.userService.findById(followerId);

    // Send notification (don't fail if notification fails)
    if (followerUser) {
      try {
        await this.notificationService.createFollowNotification({
          followerId,
          followingId,
          followerUserName: followerUser.username,
        });
      } catch (error) {
        console.error('Failed to create follow notification:', error);
      }
    }

    return {
      message: 'User followed successfully',
      follow: FollowMapper.toResponseDto(follow),
    };
  }
}
