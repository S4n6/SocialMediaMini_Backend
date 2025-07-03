import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto, UserResponse } from './users.interfaces';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const { email, username, password, birthDate, ...userData } = createUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(username ? [{ username }] : [])],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const processedBirthDate = birthDate ? new Date(birthDate) : undefined;

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        birthDate: processedBirthDate,
        ...userData,
      },
    });

    return this.excludePassword(user);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.excludePassword(user));
  }

  async findOne(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            postMedia: true,
            reactions: true,
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    fullname: true,
                    profilePicture: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true,
            friendsA: true,
            friendsB: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.excludePassword(user);
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<UserResponse | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    return user ? this.excludePassword(user) : null;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    const { username, ...updateData } = updateUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (username && username !== existingUser.username) {
      const userWithUsername = await this.prisma.user.findUnique({
        where: { username },
      });

      if (userWithUsername && userWithUsername.id !== id) {
        throw new ConflictException('Username already exists');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        username,
        ...updateData,
      },
    });

    return this.excludePassword(updatedUser);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  }

  async searchUsers(query: string): Promise<UserResponse[]> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            username: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            fullname: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: 20, // Limit results
    });

    return users.map((user) => this.excludePassword(user));
  }

  async getUserFriends(userId: string): Promise<UserResponse[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        friendsA: {
          include: {
            userB: true,
          },
        },
        friendsB: {
          include: {
            userA: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const friends: any[] = [
      ...user.friendsA.map((friendship) => friendship.userB),
      ...user.friendsB.map((friendship) => friendship.userA),
    ];

    return friends.map((friend) => this.excludePassword(friend));
  }

  async addFriend(
    userId: string,
    friendId: string,
  ): Promise<{ message: string }> {
    if (userId === friendId) {
      throw new BadRequestException('Cannot add yourself as a friend');
    }

    // Check if both users exist
    const [user, friend] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: friendId } }),
    ]);

    if (!user || !friend) {
      throw new NotFoundException('User not found');
    }

    // Check if friendship already exists
    const existingFriendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
      },
    });

    if (existingFriendship) {
      throw new ConflictException('Friendship already exists');
    }

    // Create friendship (always put smaller ID first for consistency)
    const [userAId, userBId] = [userId, friendId].sort();

    await this.prisma.friend.create({
      data: {
        userAId,
        userBId,
      },
    });

    return { message: 'Friend added successfully' };
  }

  async removeFriend(
    userId: string,
    friendId: string,
  ): Promise<{ message: string }> {
    const friendship = await this.prisma.friend.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: friendId },
          { userAId: friendId, userBId: userId },
        ],
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

  private excludePassword(user: any): UserResponse {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
