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
import { ITokenGenerator } from './interfaces/token-generator.interface';
import { Token } from '../domain/value-objects/token.vo';

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
    @Inject('TOKEN_GENERATOR')
    private tokenGenerator: ITokenGenerator,
  ) {}

  /**
   * Find user by email OR username (auth-specific method)
   */
  async findUserByEmailOrUsername(identifier: string): Promise<User | null> {
    let user = await this.userRepository.findByEmail(identifier);
    console.log('User found by email:', user);
    if (!user) {
      user = await this.userRepository.findByUsername(identifier);
    }
    return user;
  }

  /**
   * Verify email by token using JWT-based verification
   */
  async verifyEmailByToken(token: string): Promise<User | null> {
    try {
      // Verify and decode the JWT token
      const tokenObj = new Token(token);
      const payload =
        await this.tokenGenerator.verifyVerificationToken(tokenObj);

      if (!payload) {
        return null; // Invalid or expired token
      }

      // Find user by ID from token payload
      const user = await this.userRepository.findById(payload.userId);

      if (!user) {
        return null; // User not found
      }

      // Verify that the email in token matches user's email (security check)
      if (user.email !== payload.email) {
        return null; // Email mismatch, potential security issue
      }

      return user;
    } catch (error) {
      console.error('Error verifying email token:', error);
      return null;
    }
  }

  /**
   * Find user by password reset token using JWT-based verification
   */
  async findUserByPasswordResetToken(token: string): Promise<User | null> {
    try {
      // Verify and decode the JWT token
      const tokenObj = new Token(token);
      const payload =
        await this.tokenGenerator.verifyPasswordResetToken(tokenObj);

      if (!payload) {
        return null; // Invalid or expired token
      }

      // Find user by ID from token payload
      const user = await this.userRepository.findById(payload.userId);

      if (!user) {
        return null; // User not found
      }

      // Verify that the email in token matches user's email (security check)
      if (user.email !== payload.email) {
        return null; // Email mismatch, potential security issue
      }

      return user;
    } catch (error) {
      console.error('Error verifying password reset token:', error);
      return null;
    }
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

  /**
   * Generate email verification token for user
   */
  async generateEmailVerificationToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const token = await this.tokenGenerator.generateVerificationToken(
      userId,
      email,
    );
    return token.value;
  }

  /**
   * Generate password reset token for user
   */
  async generatePasswordResetToken(
    userId: string,
    email: string,
  ): Promise<string> {
    const token = await this.tokenGenerator.generatePasswordResetToken(
      userId,
      email,
    );
    return token.value;
  }

  /**
   * Find user by email (alias for findUserByEmail)
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.findUserByEmail(email);
  }

  /**
   * Update last verification email sent timestamp
   */
  async updateLastVerificationSentAt(
    userId: string,
    timestamp: Date,
  ): Promise<void> {
    // For now, we'll use lastProfileUpdate field as a placeholder
    // In production, you should add a specific lastVerificationSentAt field to User model
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        lastProfileUpdate: timestamp,
      },
    });
  }
}
