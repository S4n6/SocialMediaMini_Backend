import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IUserRepository } from '../../users/application';
import { USER_REPOSITORY_TOKEN } from '../../users/users.module';
import { User } from '../../users/domain/user.entity';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Auth Service - Wrapper for Users Repository with Auth-specific logic
 * Bridges the gap between Auth module needs and Users repository capabilities
 *
 * NOTE: This is a temporary solution until verification tokens are added to schema
 */
@Injectable()
export class AuthUserService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private userRepository: IUserRepository,
    private prismaService: PrismaService, // For auth-specific queries
  ) {}

  /**
   * Find user by email OR username (auth-specific method)
   */
  async findUserByEmailOrUsername(identifier: string): Promise<User | null> {
    // Try email first
    let user = await this.userRepository.findByEmail(identifier);
    if (!user) {
      // Try username if email fails
      user = await this.userRepository.findByUsername(identifier);
    }
    return user;
  }

  /**
   * Verify email by token (auth-specific method)
   * TODO: Add emailVerificationToken field to User schema
   */
  async verifyEmailByToken(token: string): Promise<User | null> {
    // For now, return null as verification token field doesn't exist in schema
    // This needs to be implemented once schema is updated
    console.warn(
      'verifyEmailByToken: Schema missing emailVerificationToken field',
    );
    return null;
  }

  /**
   * Find user by password reset token (auth-specific method)
   * TODO: Add passwordResetToken field to User schema
   */
  async findUserByPasswordResetToken(token: string): Promise<User | null> {
    // For now, return null as password reset token field doesn't exist in schema
    // This needs to be implemented once schema is updated
    console.warn(
      'findUserByPasswordResetToken: Schema missing passwordResetToken field',
    );
    return null;
  }

  /**
   * Update user password using repository
   */
  async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    // Use prisma directly for now as User entity doesn't expose password update method
    await this.prismaService.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  /**
   * Verify user email
   */
  async verifyUserEmail(userId: string): Promise<void> {
    // Use prisma directly for now
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
  }

  /**
   * Check if email exists
   */
  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    return user !== null;
  }

  /**
   * Check if username exists
   */
  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.userRepository.findByUsername(username);
    return user !== null;
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findById(userId);
  }

  /**
   * Find user by email (direct access to repository method)
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Create user from Google OAuth data
   */
  async createUserFromGoogle(googleData: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }): Promise<User> {
    // Use UserFactory to create user from Google data
    const { UserFactory } = await import(
      '../../users/domain/factories/user.factory'
    );

    return await UserFactory.createUserFromGoogle({
      googleId: googleData.googleId,
      email: googleData.email,
      profile: {
        fullName: googleData.fullName,
        avatar: googleData.avatar,
      },
    });
  }

  /**
   * Save user (create or update)
   */
  async saveUser(user: User): Promise<void> {
    await this.userRepository.save(user);
  }
}
