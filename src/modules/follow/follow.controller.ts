import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './follow.service';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CreateFriendDto } from './dto/createFriend.dto';
import { CurrentUser } from 'src/decorators/currentUser.decorator';
import { ROLES } from 'src/constants/roles.constant';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('follow')
  async followUser(
    @Body() createFriendDto: CreateFriendDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.followUser(
      createFriendDto,
      userId,
    );

    return {
      message: 'User followed successfully',
      data: result,
    };
  }

  @Delete('unfollow/:friendId')
  async unfollowUser(
    @Param('friendId') friendId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.unfollowUser(friendId, userId);

    return {
      message: 'User unfollowed successfully',
      data: result,
    };
  }

  @Get('followers/:userId')
  async getFollowers(@Param('userId') userId: string) {
    const result = await this.friendsService.getFollowers(userId);

    return {
      message: 'Followers retrieved successfully',
      data: result,
    };
  }

  @Get('following/:userId')
  async getFollowing(@Param('userId') userId: string) {
    const result = await this.friendsService.getFollowing(userId);

    return {
      message: 'Following list retrieved successfully',
      data: result,
    };
  }

  @Get('my-followers')
  async getMyFollowers(@CurrentUser('id') userId: string) {
    const result = await this.friendsService.getFollowers(userId);

    return {
      message: 'Your followers retrieved successfully',
      data: result,
    };
  }

  @Get('my-following')
  async getMyFollowing(@CurrentUser('id') userId: string) {
    const result = await this.friendsService.getFollowing(userId);

    return {
      message: 'Your following list retrieved successfully',
      data: result,
    };
  }

  @Get('check-status/:targetUserId')
  async checkFollowStatus(
    @Param('targetUserId') targetUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.friendsService.checkFollowStatus(
      userId,
      targetUserId,
    );

    return {
      message: 'Follow status retrieved successfully',
      data: result,
    };
  }

  @Get('stats/:userId')
  async getUserStats(@Param('userId') userId: string) {
    const result = await this.friendsService.getUserStats(userId);

    return {
      message: 'User stats retrieved successfully',
      data: result,
    };
  }

  @Get('my-stats')
  async getMyStats(@CurrentUser('id') userId: string) {
    const result = await this.friendsService.getUserStats(userId);

    return {
      message: 'Your stats retrieved successfully',
      data: result,
    };
  }

  // Admin routes
  @Get()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  async findAll() {
    const result = await this.friendsService.findAll();

    return {
      message: 'All follows retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  async findOne(@Param('id') id: string) {
    const result = await this.friendsService.findOne(id);

    return {
      message: 'Follow relationship retrieved successfully',
      data: result,
    };
  }
}
