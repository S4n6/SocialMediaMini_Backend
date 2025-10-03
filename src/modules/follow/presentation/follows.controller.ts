import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FollowApplicationService } from '../application/follow-application.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import { FollowUserDto, GetFollowsQuery } from '../application/dto/follow.dto';
import { CurrentUser } from '../../../shared/decorators/currentUser.decorator';
import { ApiResponse } from '../../../shared/common/interfaces/api-response.interface';
import {
  FollowUserResponseDto,
  FollowResponseDto,
  FollowersResponseDto,
  FollowingResponseDto,
  FollowStatusResponseDto,
} from '../application/dto/follow-response.dto';

@Controller('follows')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(
    private readonly followApplicationService: FollowApplicationService,
  ) {}

  @Post('follow')
  async followUser(
    @Body() followUserDto: FollowUserDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<FollowUserResponseDto>> {
    const result = await this.followApplicationService.followUser(
      followUserDto,
      userId,
    );

    return {
      success: true,
      message: result.message,
      data: result,
    };
  }

  @Delete('unfollow/:targetUserId')
  async unfollowUser(
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const result = await this.followApplicationService.unfollowUser(
      targetUserId,
      userId,
    );

    return {
      success: true,
      message: result.message,
      data: result,
    };
  }

  @Get('followers/:userId')
  async getFollowers(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<FollowersResponseDto>> {
    const result = await this.followApplicationService.getFollowers(userId);

    return {
      success: true,
      message: 'Followers retrieved successfully',
      data: result,
    };
  }

  @Get('following/:userId')
  async getFollowing(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<FollowingResponseDto>> {
    const result = await this.followApplicationService.getFollowing(userId);

    return {
      success: true,
      message: 'Following list retrieved successfully',
      data: result,
    };
  }

  @Get('my-followers')
  async getMyFollowers(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<FollowersResponseDto>> {
    const result = await this.followApplicationService.getFollowers(userId);

    return {
      success: true,
      message: 'Your followers retrieved successfully',
      data: result,
    };
  }

  @Get('my-following')
  async getMyFollowing(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<FollowingResponseDto>> {
    const result = await this.followApplicationService.getFollowing(userId);

    return {
      success: true,
      message: 'Your following list retrieved successfully',
      data: result,
    };
  }

  @Get('check-status/:targetUserId')
  async checkFollowStatus(
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<FollowStatusResponseDto>> {
    const result = await this.followApplicationService.getFollowStatus(
      userId,
      targetUserId,
    );

    return {
      success: true,
      message: 'Follow status retrieved successfully',
      data: result,
    };
  }

  @Get()
  async getFollows(
    @Query() query: GetFollowsQuery,
  ): Promise<ApiResponse<FollowResponseDto[]>> {
    const result = await this.followApplicationService.getFollows(query);

    return {
      success: true,
      message: 'Follows retrieved successfully',
      data: result,
    };
  }
}
