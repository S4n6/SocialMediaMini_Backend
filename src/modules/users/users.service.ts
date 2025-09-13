import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/createUser.dto';
import { UserResponse } from './dto/responseUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ROLES } from 'src/constants/roles.constant';
import { AuthService } from '../auth/auth.service';

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

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
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
    return userResponse;
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.prisma.user.findMany({
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

    return users.map((user) => {
      const { password, ...userResponse } = user;
      return userResponse as UserResponse;
    });
  }

  async findOne(id: string): Promise<UserResponse> {
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
    return userResponse as UserResponse;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
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
    return userResponse as UserResponse;
  }

  async remove(id: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Revoke all refresh tokens before deleting user for security
    await this.authService.revokeAllUserRefreshTokens(id);

    // Delete user (cascading will handle related records)
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
            fullName: {
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
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
      take: 20, // Limit search results
    });

    return users.map((user) => {
      const { password, ...userResponse } = user;
      return userResponse as UserResponse;
    });
  }

  async getUserProfile(id: string): Promise<any> {
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
    return userProfile as UserResponse;
  }

  // Find a user by userName (unique) or fallback to fullName/email.
  async findByUsername(username: string): Promise<UserResponse | null> {
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
    return userResponse as UserResponse;
  }
}
