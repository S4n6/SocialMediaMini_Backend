import { Injectable } from '@nestjs/common';
import { FollowUserDto, GetFollowsQuery } from './dto/follow.dto';
import {
  FollowUserResponseDto,
  FollowResponseDto,
  FollowersResponseDto,
  FollowingResponseDto,
  FollowStatusResponseDto,
} from './dto/follow-response.dto';
import { FollowUserUseCase } from './use-cases/follow-user.use-case';
import { UnfollowUserUseCase } from './use-cases/unfollow-user.use-case';
import { GetFollowersUseCase } from './use-cases/get-followers.use-case';
import { GetFollowingUseCase } from './use-cases/get-following.use-case';
import { GetFollowStatusUseCase } from './use-cases/get-follow-status.use-case';
import { GetFollowsUseCase } from './use-cases/get-follows.use-case';

@Injectable()
export class FollowApplicationService {
  constructor(
    private readonly followUserUseCase: FollowUserUseCase,
    private readonly unfollowUserUseCase: UnfollowUserUseCase,
    private readonly getFollowersUseCase: GetFollowersUseCase,
    private readonly getFollowingUseCase: GetFollowingUseCase,
    private readonly getFollowStatusUseCase: GetFollowStatusUseCase,
    private readonly getFollowsUseCase: GetFollowsUseCase,
  ) {}

  async followUser(
    dto: FollowUserDto,
    userId: string,
  ): Promise<FollowUserResponseDto> {
    return this.followUserUseCase.execute(dto, userId);
  }

  async unfollowUser(
    targetUserId: string,
    userId: string,
  ): Promise<{ message: string }> {
    await this.unfollowUserUseCase.execute(targetUserId, userId);
    return { message: 'User unfollowed successfully' };
  }

  async getFollowers(userId: string): Promise<FollowersResponseDto> {
    return this.getFollowersUseCase.execute(userId);
  }

  async getFollowing(userId: string): Promise<FollowingResponseDto> {
    return this.getFollowingUseCase.execute(userId);
  }

  async getFollowStatus(
    userId: string,
    targetUserId: string,
  ): Promise<FollowStatusResponseDto> {
    return this.getFollowStatusUseCase.execute(userId, targetUserId);
  }

  async getFollows(query?: GetFollowsQuery): Promise<FollowResponseDto[]> {
    return this.getFollowsUseCase.execute(query);
  }
}
