import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  IUserRepository,
  User,
  UserFactory,
  UserId,
  UserEmail,
  Username,
} from '../domain';

/**
 * Prisma implementation of UserRepository
 * Updated to work with new schema structure
 */
@Injectable()
export class UserPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<void> {
    const userData = this.mapToDataModel(user);

    await this.prisma.user.upsert({
      where: { id: user.id },
      update: userData,
      create: userData,
    });
  }

  async findById(id: UserId): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id: id.getValue() },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!userData) {
      return null;
    }

    return this.mapToDomainModel(userData);
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email: email.getValue() },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!userData) {
      return null;
    }

    return this.mapToDomainModel(userData);
  }

  async findByUsername(username: Username): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { username: username.getValue() }, // Updated to use 'userName'
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!userData) {
      return null;
    }

    return this.mapToDomainModel(userData);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { googleId },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    if (!userData) {
      return null;
    }

    return this.mapToDomainModel(userData);
  }

  async existsByEmail(email: UserEmail): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.getValue() },
    });
    return count > 0;
  }

  async existsByUsername(username: Username): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username: username.getValue() }, // Updated to use 'username'
    });
    return count > 0;
  }

  async deleteById(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.getValue() },
    });
  }

  async findByIds(ids: UserId[]): Promise<User[]> {
    const userIds = ids.map((id) => id.getValue());
    const usersData = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    return usersData.map((userData) => this.mapToDomainModel(userData));
  }

  async searchUsers(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<{
    users: User[];
    total: number;
  }> {
    const whereCondition = {
      OR: [
        { username: { contains: query, mode: 'insensitive' as const } }, // Updated field name
        { fullName: { contains: query, mode: 'insensitive' as const } }, // Direct field access
      ],
    };

    const [usersData, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereCondition,
        include: {
          followers: { select: { followerId: true } },
          following: { select: { followingId: true } },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: whereCondition }),
    ]);

    return {
      users: usersData.map((userData) => this.mapToDomainModel(userData)),
      total,
    };
  }

  async getFollowers(
    userId: UserId,
    limit = 20,
    offset = 0,
  ): Promise<{
    users: User[];
    total: number;
  }> {
    const [followData, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId.getValue() },
        include: {
          follower: {
            include: {
              followers: { select: { followerId: true } },
              following: { select: { followingId: true } },
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({
        where: { followingId: userId.getValue() },
      }),
    ]);

    return {
      users: followData.map((follow) => this.mapToDomainModel(follow.follower)),
      total,
    };
  }

  async getFollowing(
    userId: UserId,
    limit = 20,
    offset = 0,
  ): Promise<{
    users: User[];
    total: number;
  }> {
    const [followData, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId.getValue() },
        include: {
          following: {
            include: {
              followers: { select: { followerId: true } },
              following: { select: { followingId: true } },
            },
          },
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({
        where: { followerId: userId.getValue() },
      }),
    ]);

    return {
      users: followData.map((follow) =>
        this.mapToDomainModel(follow.following),
      ),
      total,
    };
  }

  async getMutualFollowers(userId1: UserId, userId2: UserId): Promise<User[]> {
    // Get users who follow both user1 and user2
    const mutualFollowsData = await this.prisma.user.findMany({
      where: {
        following: {
          some: {
            followingId: {
              in: [userId1.getValue(), userId2.getValue()],
            },
          },
        },
      },
      include: {
        followers: { select: { followerId: true } },
        following: { select: { followingId: true } },
      },
    });

    return mutualFollowsData.map((userData) => this.mapToDomainModel(userData));
  }

  async getUserStats(userId: UserId): Promise<{
    followersCount: number;
    followingCount: number;
    postsCount: number;
  }> {
    const [followersCount, followingCount, postsCount] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: userId.getValue() },
      }),
      this.prisma.follow.count({
        where: { followerId: userId.getValue() },
      }),
      this.prisma.post.count({
        where: { authorId: userId.getValue() },
      }),
    ]);

    return {
      followersCount,
      followingCount,
      postsCount,
    };
  }

  async updateFollowRelationship(
    followerId: UserId,
    followeeId: UserId,
    isFollowing: boolean,
  ): Promise<void> {
    if (isFollowing) {
      await this.prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: followerId.getValue(),
            followingId: followeeId.getValue(),
          },
        },
        update: {},
        create: {
          followerId: followerId.getValue(),
          followingId: followeeId.getValue(),
        },
      });
    } else {
      await this.prisma.follow.deleteMany({
        where: {
          followerId: followerId.getValue(),
          followingId: followeeId.getValue(),
        },
      });
    }
  }

  private mapToDomainModel(userData: any): User {
    return UserFactory.reconstructUser({
      id: userData.id,
      username: userData.username, // Updated field name
      email: userData.email,
      passwordHash: userData.passwordHash, // Updated field name
      googleId: userData.googleId,
      role: userData.role,
      status: userData.status, // New field
      isEmailVerified: userData.isEmailVerified,
      emailVerifiedAt: userData.emailVerifiedAt,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      lastProfileUpdate: userData.lastProfileUpdate, // New field
      profile: {
        fullName: userData.fullName,
        bio: userData.bio,
        avatar: userData.avatar,
        location: userData.location,
        websiteUrl: userData.websiteUrl,
        dateOfBirth: userData.dateOfBirth,
        phoneNumber: userData.phoneNumber,
        gender: userData.gender,
      },
      followingIds: userData.following?.map((f: any) => f.followingId) || [],
      followerIds: userData.followers?.map((f: any) => f.followerId) || [],
    });
  }

  private mapToDataModel(user: User): any {
    return {
      id: user.id,
      username: user.username, // Updated field name
      email: user.email,
      passwordHash: user.passwordHash, // Need to add getter in User entity
      googleId: user.googleId,
      role: user.role,
      status: user.status, // New field
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      updatedAt: user.updatedAt,
      lastProfileUpdate: user.lastProfileUpdate,
      // Profile fields are now direct on User model
      fullName: user.profile.fullName,
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      location: user.profile.location,
      websiteUrl: user.profile.websiteUrl,
      dateOfBirth: user.profile.dateOfBirth,
      phoneNumber: user.profile.phoneNumber,
      gender: user.profile.gender,
    };
  }
}
