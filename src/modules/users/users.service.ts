import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/createUser.dto';
import { UserResponse, UserListItem } from './dto/responseUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ROLES } from 'src/constants/roles.constant';
import { AuthService } from '../auth/auth.service';
import {
  ApiResponse,
  createSuccessResponse,
  PaginationMeta,
} from 'src/common/interfaces/api-response.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // Generate a simple unique username based on provided base (email local part or name)
  private async generateUniqueUsername(base: string): Promise<string> {
    const cleaned = (base || 'user').replace(/\s+/g, '').toLowerCase();
    let candidate = cleaned;
    let counter = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const exists = await this.prisma.user.findUnique({
        where: { userName: candidate },
      });
      if (!exists) return candidate;
      counter += 1;
      candidate = `${cleaned}${counter}`;
    }
  }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<ApiResponse<UserResponse>> {
    const { email, password, dateOfBirth, fullName, ...rest } = createUserDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    // derive a username from first/last name or email local-part and ensure uniqueness
    const baseUsername = fullName || email.split('@')[0];
    const userName = await this.generateUniqueUsername(baseUsername);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        userName,
        ...rest,
        email,
        password: hashedPassword,
        dateOfBirth: new Date(dateOfBirth),
        role: ROLES.USER,
      },
    });

    // Return user without password
    const { password: _, ...userResponse } = user;
    return createSuccessResponse(
      userResponse as UserResponse,
      'User created successfully',
      201,
    );
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse<UserResponse[]>> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              posts: true,
              comments: true,
              reactions: true,
              followers: true,
              following: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    const usersResponse = users.map((user) => {
      const { password, ...userResponse } = user;
      return userResponse as UserResponse;
    });

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return createSuccessResponse(
      usersResponse,
      'Users retrieved successfully',
      200,
      pagination,
    );
  }

  async findOne(id: string): Promise<ApiResponse<UserResponse>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userResponse } = user;
    return createSuccessResponse(
      userResponse as UserResponse,
      'User retrieved successfully',
    );
  }

  async findManyByIds(ids: string[]): Promise<UserListItem[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    try {
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        select: {
          id: true,
          userName: true,
          fullName: true,
          avatar: true,
          createdAt: true,
        },
      });

      // Return users in the same order as the input IDs
      const userMap = new Map(users.map((user) => [user.id, user]));
      return ids.map((id) => userMap.get(id)).filter(Boolean) as UserListItem[];
    } catch (error) {
      console.error('Error finding users by IDs:', error);
      throw error;
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<UserResponse>> {
    const { email, password, dateOfBirth, fullName, ...rest } = updateUserDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if email is being updated
    if (email && email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email },
      });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // Hash password if being updated
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...rest,
        ...(email && { email }),
        ...(hashedPassword && { password: hashedPassword }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      },
    });

    const { password: _, ...userResponse } = updatedUser;
    return createSuccessResponse(
      userResponse as UserResponse,
      'User updated successfully',
    );
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Revoke all sessions before deleting user for security
    await this.authService.revokeAllUserSessions(id);

    // Delete user (cascading will handle related records)
    await this.prisma.user.delete({
      where: { id },
    });

    return createSuccessResponse(null, 'User deleted successfully');
  }

  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<UserListItem[]>> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Search query is required');
    }

    const skip = (page - 1) * limit;

    const whereClause: Prisma.UserWhereInput = {
      OR: [
        { fullName: { contains: query, mode: Prisma.QueryMode.insensitive } },
        { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
        { userName: { contains: query, mode: Prisma.QueryMode.insensitive } },
      ],
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where: whereClause,
        select: {
          id: true,
          userName: true,
          fullName: true,
          avatar: true,
          bio: true,
          websiteUrl: true,
        },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    // users already contain only the selected fields, map to UserListItem explicitly
    const usersResponse: UserListItem[] = users.map((u) => ({
      id: u.id,
      userName: u.userName,
      fullName: u.fullName,
      avatar: u.avatar,
      bio: u.bio,
      websiteUrl: u.websiteUrl,
    }));

    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return createSuccessResponse(
      usersResponse,
      `Found ${total} users matching "${query}"`,
      200,
      pagination,
    );
  }

  async getUserProfile(id: string): Promise<ApiResponse<any>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            reactions: {
              include: {
                reactor: {
                  select: {
                    id: true,
                    fullName: true,
                    avatar: true,
                  },
                },
              },
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    fullName: true,
                    avatar: true,
                  },
                },
              },
              take: 3,
            },
            _count: {
              select: {
                reactions: true,
                comments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        followers: {
          include: {
            follower: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        following: {
          include: {
            following: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userProfile } = user;
    return createSuccessResponse(
      userProfile,
      'User profile retrieved successfully',
    );
  }

  // Find a user by userName (unique) or fallback to fullName/email.
  async findByUsername(
    username: string,
  ): Promise<ApiResponse<UserResponse> | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { userName: username },
          { email: username },
          { fullName: username },
        ],
      },
      include: {
        _count: {
          select: {
            posts: true,
            comments: true,
            reactions: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) return null;
    const { password, ...userResponse } = user;
    return createSuccessResponse(
      userResponse as UserResponse,
      'User found by username',
    );
  }
}
