import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFriendDto } from './dto/createFriend.dto';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  // Follow a user
  async followUser(createFriendDto: CreateFriendDto, userId: string) {
    const { friendId } = createFriendDto;

    // Can't follow yourself
    if (userId === friendId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    // Check if user to follow exists
    const userToFollow = await this.prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.follow.findFirst({
      where: {
        followerId: userId,
        followingId: friendId,
      },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user');
    }

    // Create follow relationship
    const follow = await this.prisma.follow.create({
      data: {
        followerId: userId,
        followingId: friendId,
      },
      include: {
        follower: {
          select: {
            id: true,
            userName: true,
            fullName: true,
            avatar: true,
          },
        },
        following: {
          select: {
            id: true,
            userName: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return {
      message: 'User followed successfully',
      follow,
    };
  }

  // Unfollow a user
  async unfollowUser(friendId: string, userId: string) {
    // Can't unfollow yourself
    if (userId === friendId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    // Check if currently following
    const existingFollow = await this.prisma.follow.findFirst({
      where: {
        followerId: userId,
        followingId: friendId,
      },
    });

    if (!existingFollow) {
      throw new NotFoundException('You are not following this user');
    }

    // Remove follow relationship
    await this.prisma.follow.delete({
      where: { id: existingFollow.id },
    });

    return {
      message: 'User unfollowed successfully',
    };
  }

  // Get user's followers
  async getFollowers(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            userName: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      userId,
      totalFollowers: followers.length,
      followers: followers.map((f) => f.follower),
    };
  }

  // Get users that user is following
  async getFollowing(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            userName: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      userId,
      totalFollowing: following.length,
      following: following.map((f) => f.following),
    };
  }

  // Check if user is following another user
  async checkFollowStatus(userId: string, targetUserId: string) {
    const isFollowing = await this.prisma.follow.findFirst({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    return {
      userId,
      targetUserId,
      isFollowing: !!isFollowing,
      followId: isFollowing?.id || null,
    };
  }

  // Get all follows (admin only)
  async findAll() {
    return this.prisma.follow.findMany({
      include: {
        follower: {
          select: {
            id: true,
            userName: true,
            fullName: true,
            avatar: true,
          },
        },
        following: {
          select: {
            id: true,
            userName: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get follow by ID
  async findOne(id: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { id },
      include: {
        follower: {
          select: {
            id: true,
            userName: true,
            fullName: true,
            avatar: true,
          },
        },
        following: {
          select: {
            id: true,
            userName: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    return follow;
  }

  // Get user stats (followers and following count)
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const followersCount = await this.prisma.follow.count({
      where: { followingId: userId },
    });

    const followingCount = await this.prisma.follow.count({
      where: { followerId: userId },
    });

    return {
      userId,
      followersCount,
      followingCount,
    };
  }
}
