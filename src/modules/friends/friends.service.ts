import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFriendDto } from './dto/createFriend.dto';
import { UpdateFriendDto } from './dto/updateFriend.dto';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  // Send friend request
  async sendFriendRequest(createFriendDto: CreateFriendDto, userId: string) {
    const { friendId } = createFriendDto;

    // Can't friend yourself
    if (userId === friendId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    // Check if friend exists
    const friendExists = await this.prisma.user.findUnique({
      where: { id: friendId },
    });

    if (!friendExists) {
      throw new NotFoundException('User not found');
    }

    // Check if friendship already exists (in either direction)
    const existingFriendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
      },
    });

    if (existingFriendship) {
      throw new ConflictException(
        'Friendship already exists or request already sent',
      );
    }

    // Create friend request
    const friendship = await this.prisma.friend.create({
      data: {
        userAId: userId,
        userBId: friendId,
        status: 'pending',
      },
      include: {
        userB: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
      },
    });

    return friendship;
  }

  // Accept friend request
  async acceptFriendRequest(friendshipId: string, userId: string) {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userAId: friendshipId, userBId: userId },
          { userAId: userId, userBId: friendshipId },
        ],
        status: 'pending',
      },
      include: {
        userA: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
        userB: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
      },
    });

    console.log('Friendship found:', friendship);

    if (!friendship) {
      throw new NotFoundException(
        'Friend request not found or already processed',
      );
    }

    // Only the receiver (userB) can accept the request
    if (friendship.userBId !== userId) {
      throw new BadRequestException(
        'You can only accept friend requests sent to you',
      );
    }

    const updatedFriendship = await this.prisma.friend.update({
      where: {
        userAId_userBId: {
          userAId: friendship.userAId,
          userBId: friendship.userBId,
        },
      },
      data: {
        status: 'accepted',
      },
      include: {
        userA: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
        userB: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
      },
    });

    return updatedFriendship;
  }

  // Decline/Reject friend request
  async declineFriendRequest(friendshipId: string, userId: string) {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userAId: friendshipId, userBId: userId },
          { userAId: userId, userBId: friendshipId },
        ],
        status: 'pending',
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Only the receiver can decline
    if (friendship.userBId !== userId) {
      throw new BadRequestException(
        'You can only decline friend requests sent to you',
      );
    }

    await this.prisma.friend.delete({
      where: {
        userAId_userBId: {
          userAId: friendship.userAId,
          userBId: friendship.userBId,
        },
      },
    });

    return { message: 'Friend request declined' };
  }

  // Get all friends (accepted friendships)
  async getFriends(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [friendships, totalCount] = await Promise.all([
      this.prisma.friend.findMany({
        where: {
          OR: [
            { userAId: userId, status: 'accepted' },
            { userBId: userId, status: 'accepted' },
          ],
        },
        skip,
        take: limit,
        include: {
          userA: {
            select: {
              id: true,
              username: true,
              fullname: true,
              profilePicture: true,
              createdAt: true,
            },
          },
          userB: {
            select: {
              id: true,
              username: true,
              fullname: true,
              profilePicture: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.friend.count({
        where: {
          OR: [
            { userAId: userId, status: 'accepted' },
            { userBId: userId, status: 'accepted' },
          ],
        },
      }),
    ]);

    // Map to get the friend (not the current user)
    const friends = friendships.map((friendship) => ({
      friendshipId: `${friendship.userAId}-${friendship.userBId}`,
      friend:
        friendship.userAId === userId ? friendship.userB : friendship.userA,
      friendsSince: friendship.createdAt,
    }));

    return {
      friends,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  // Get pending friend requests (received)
  async getPendingRequests(userId: string) {
    const pendingRequests = await this.prisma.friend.findMany({
      where: {
        userBId: userId,
        status: 'pending',
      },
      include: {
        userA: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return pendingRequests.map((request) => ({
      requestId: request.userAId,
      from: request.userA,
      sentAt: request.createdAt,
    }));
  }

  // Get sent friend requests
  async getSentRequests(userId: string) {
    const sentRequests = await this.prisma.friend.findMany({
      where: {
        userAId: userId,
        status: 'pending',
      },
      include: {
        userB: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sentRequests.map((request) => ({
      requestId: request.userBId,
      to: request.userB,
      sentAt: request.createdAt,
    }));
  }

  // Remove friend
  async removeFriend(friendId: string, userId: string) {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
        status: 'accepted',
      },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship not found');
    }

    await this.prisma.friend.delete({
      where: {
        userAId_userBId: {
          userAId: friendship.userAId,
          userBId: friendship.userBId,
        },
      },
    });

    return { message: 'Friend removed successfully' };
  }

  // Block user
  async blockUser(friendId: string, userId: string) {
    // Remove existing friendship if any
    const existingFriendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
      },
    });

    if (existingFriendship) {
      await this.prisma.friend.delete({
        where: {
          userAId_userBId: {
            userAId: existingFriendship.userAId,
            userBId: existingFriendship.userBId,
          },
        },
      });
    }

    // Create block relationship
    const blockRelationship = await this.prisma.friend.create({
      data: {
        userAId: userId,
        userBId: friendId,
        status: 'blocked',
      },
    });

    return { message: 'User blocked successfully' };
  }

  // Unblock user
  async unblockUser(friendId: string, userId: string) {
    const blockRelationship = await this.prisma.friend.findFirst({
      where: {
        userAId: userId,
        userBId: friendId,
        status: 'blocked',
      },
    });

    if (!blockRelationship) {
      throw new NotFoundException('Block relationship not found');
    }

    await this.prisma.friend.delete({
      where: {
        userAId_userBId: {
          userAId: userId,
          userBId: friendId,
        },
      },
    });

    return { message: 'User unblocked successfully' };
  }

  // Check friendship status
  async getFriendshipStatus(friendId: string, userId: string) {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
      },
    });

    if (!friendship) {
      return { status: 'none' };
    }

    return {
      status: friendship.status,
      initiator: friendship.userAId === userId ? 'you' : 'them',
      createdAt: friendship.createdAt,
    };
  }

  // Search users (potential friends)
  async searchUsers(
    query: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } }, // Exclude current user
          {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { fullname: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        profilePicture: true,
      },
      skip,
      take: limit,
    });

    // Get friendship status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendshipStatus = await this.getFriendshipStatus(
          user.id,
          userId,
        );
        return {
          ...user,
          friendshipStatus: friendshipStatus.status,
        };
      }),
    );

    return usersWithStatus;
  }

  // Get mutual friends
  async getMutualFriends(friendId: string, userId: string) {
    const userFriends = await this.prisma.friend.findMany({
      where: {
        OR: [
          { userAId: userId, status: 'accepted' },
          { userBId: userId, status: 'accepted' },
        ],
      },
      select: {
        userAId: true,
        userBId: true,
      },
    });

    const friendFriends = await this.prisma.friend.findMany({
      where: {
        OR: [
          { userAId: friendId, status: 'accepted' },
          { userBId: friendId, status: 'accepted' },
        ],
      },
      select: {
        userAId: true,
        userBId: true,
      },
    });

    // Get friend IDs
    const userFriendIds = userFriends.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );
    const friendFriendIds = friendFriends.map((f) =>
      f.userAId === friendId ? f.userBId : f.userAId,
    );

    // Find mutual friends
    const mutualFriendIds = userFriendIds.filter((id) =>
      friendFriendIds.includes(id),
    );

    if (mutualFriendIds.length === 0) {
      return [];
    }

    const mutualFriends = await this.prisma.user.findMany({
      where: {
        id: { in: mutualFriendIds },
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        profilePicture: true,
      },
    });

    return mutualFriends;
  }

  // Friend suggestions based on mutual friends
  async getFriendSuggestions(userId: string, limit: number = 10) {
    // Get user's friends
    const userFriends = await this.prisma.friend.findMany({
      where: {
        OR: [
          { userAId: userId, status: 'accepted' },
          { userBId: userId, status: 'accepted' },
        ],
      },
    });

    const friendIds = userFriends.map((f) =>
      f.userAId === userId ? f.userBId : f.userAId,
    );

    if (friendIds.length === 0) {
      return [];
    }

    // Get friends of friends
    const friendsOfFriends = await this.prisma.friend.findMany({
      where: {
        OR: [
          { userAId: { in: friendIds }, status: 'accepted' },
          { userBId: { in: friendIds }, status: 'accepted' },
        ],
      },
    });

    // Get potential friend IDs (excluding current user and existing friends)
    const potentialFriendIds = friendsOfFriends
      .map((f) =>
        f.userAId === userId
          ? f.userBId
          : f.userBId === userId
            ? f.userAId
            : friendIds.includes(f.userAId)
              ? f.userBId
              : f.userAId,
      )
      .filter((id) => id !== userId && !friendIds.includes(id));

    // Count mutual friends for each suggestion
    const suggestionCounts = potentialFriendIds.reduce((acc, id) => {
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    }, {});

    // Get top suggestions
    const topSuggestions = Object.entries(suggestionCounts)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
      .slice(0, limit)
      .map(([id]) => id);

    if (topSuggestions.length === 0) {
      return [];
    }

    const suggestions = await this.prisma.user.findMany({
      where: {
        id: { in: topSuggestions },
      },
      select: {
        id: true,
        username: true,
        fullname: true,
        profilePicture: true,
      },
    });

    return suggestions.map((user) => ({
      ...user,
      mutualFriendsCount: suggestionCounts[user.id],
    }));
  }
}
