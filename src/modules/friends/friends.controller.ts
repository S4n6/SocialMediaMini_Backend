import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateFriendDto } from './dto/createFriend.dto';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../constants/roles.constant';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // Send friend request
  @Post('request')
  async sendFriendRequest(
    @Body() createFriendDto: CreateFriendDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.sendFriendRequest(
      createFriendDto,
      userId,
    );

    return {
      message: 'Friend request sent successfully',
      data: result,
    };
  }

  // Accept friend request
  @Patch('accept/:friendId')
  async acceptFriendRequest(
    @Param('friendId') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.acceptFriendRequest(
      friendId,
      userId,
    );

    return {
      message: 'Friend request accepted successfully',
      data: result,
    };
  }

  // Decline friend request
  @Delete('decline/:friendId')
  async declineFriendRequest(
    @Param('friendId') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.declineFriendRequest(
      friendId,
      userId,
    );

    return result;
  }

  // Get all friends (accepted friendships)
  @Get()
  async getFriends(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.friendsService.getFriends(userId, page, limit);

    return {
      message: 'Friends retrieved successfully',
      data: result.friends,
      pagination: result.pagination,
    };
  }

  // Get pending friend requests (received)
  @Get('requests/pending')
  async getPendingRequests(@CurrentUser('id') userId: string) {
    const result = await this.friendsService.getPendingRequests(userId);

    return {
      message: 'Pending friend requests retrieved successfully',
      data: result,
    };
  }

  // Get sent friend requests
  @Get('requests/sent')
  async getSentRequests(@CurrentUser('id') userId: string) {
    const result = await this.friendsService.getSentRequests(userId);

    return {
      message: 'Sent friend requests retrieved successfully',
      data: result,
    };
  }

  // Remove friend
  @Delete(':friendId')
  async removeFriend(
    @Param('friendId') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.removeFriend(friendId, userId);

    return result;
  }

  // Block user
  @Post('block/:friendId')
  async blockUser(
    @Param('friendId') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.blockUser(friendId, userId);

    return result;
  }

  // Unblock user
  @Delete('block/:friendId')
  async unblockUser(
    @Param('friendId') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.unblockUser(friendId, userId);

    return result;
  }

  // Check friendship status
  @Get('status/:friendId')
  async getFriendshipStatus(
    @Param('friendId') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.getFriendshipStatus(
      friendId,
      userId,
    );

    return {
      message: 'Friendship status retrieved successfully',
      data: result,
    };
  }

  // Search users (potential friends)
  @Get('search')
  async searchUsers(
    @Query('q') query: string,
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim() === '') {
      return {
        message: 'Search query is required',
        data: [],
      };
    }

    const result = await this.friendsService.searchUsers(
      query.trim(),
      userId,
      page,
      limit,
    );

    return {
      message: `Search results for "${query}"`,
      data: result,
      query: query.trim(),
    };
  }

  // Get mutual friends
  @Get('mutual/:friendId')
  async getMutualFriends(
    @Param('friendId') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.getMutualFriends(friendId, userId);

    return {
      message: 'Mutual friends retrieved successfully',
      data: result,
    };
  }

  // Friend suggestions based on mutual friends
  @Get('suggestions')
  async getFriendSuggestions(
    @CurrentUser('id') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.friendsService.getFriendSuggestions(
      userId,
      limit,
    );

    return {
      message: 'Friend suggestions retrieved successfully',
      data: result,
    };
  }

  // Get user's friends for specific user (public endpoint with privacy checks)
  @Get('user/:userId')
  async getUserFriends(
    @Param('userId') targetUserId: string,
    @CurrentUser('id') currentUserId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    // Check if current user can view this user's friends
    const friendshipStatus = await this.friendsService.getFriendshipStatus(
      targetUserId,
      currentUserId,
    );

    if (
      targetUserId !== currentUserId &&
      friendshipStatus.status !== 'accepted'
    ) {
      return {
        message: 'You can only view friends of users you are friends with',
        data: [],
      };
    }

    const result = await this.friendsService.getFriends(
      targetUserId,
      page,
      limit,
    );

    return {
      message: 'User friends retrieved successfully',
      data: result.friends,
      pagination: result.pagination,
    };
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllFriendships(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    // This would be implemented in service for admin use
    return {
      message: 'All friendships retrieved successfully (Admin)',
      data: [], // Implement in service if needed
    };
  }

  // Cancel sent friend request
  @Delete('cancel/:friendId')
  async cancelFriendRequest(
    @Param('friendId') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    // Decline request but from sender's perspective
    const result = await this.friendsService.declineFriendRequest(
      userId,
      friendId,
    );

    return {
      message: 'Friend request cancelled successfully',
      data: result,
    };
  }

  // Get friendship statistics
  @Get('stats')
  async getFriendshipStats(@CurrentUser('id') userId: string) {
    const [friends, pendingReceived, pendingSent] = await Promise.all([
      this.friendsService.getFriends(userId, 1, 1000), // Get all friends for count
      this.friendsService.getPendingRequests(userId),
      this.friendsService.getSentRequests(userId),
    ]);

    return {
      message: 'Friendship statistics retrieved successfully',
      data: {
        totalFriends: friends.pagination.totalCount,
        pendingRequestsReceived: pendingReceived.length,
        pendingRequestsSent: pendingSent.length,
        totalConnections:
          friends.pagination.totalCount +
          pendingReceived.length +
          pendingSent.length,
      },
    };
  }
}
