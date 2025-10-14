import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserApplicationService } from '../../users/application/user-application.service';
import { User } from '../../users/domain/user.entity';
import { ITokenGenerator } from './interfaces/token-generator.interface';
import { Token } from '../domain/value-objects/token.vo';
import { VerificationTokenService } from '../infrastructure/services/verification-token.service';

/**
 * Auth Service - Wrapper for Users Repository with Auth-specific logic
 * Bridges the gap between Auth module needs and Users repository capabilities
 *
 * NOTE: This is a temporary solution until verification tokens are added to schema
 */
@Injectable()
export class AuthUserService {
  constructor(
    private userApplicationService: UserApplicationService,
    @Inject('TOKEN_GENERATOR')
    private tokenGenerator: ITokenGenerator,
    private verificationTokenService: VerificationTokenService,
  ) {}

  /**
   * Find user by email OR username (auth-specific method)
   */
  async findUserByEmailOrUsername(identifier: string): Promise<User | null> {
    return await this.userApplicationService.findUserByEmailOrUsername(
      identifier,
    );
  }

  /**
   * Verify email by token using JWT-based verification
   */
  async verifyEmailByToken(token: string): Promise<User | null> {
    try {
      // Verify and decode the JWT token using VerificationTokenService
      // (matches tokens created by TokenRepository.generateEmailVerificationToken)
      const payload =
        await this.verificationTokenService.verifyEmailVerificationToken(token);

      if (!payload) {
        return null; // Invalid or expired token
      }

      // Find user by ID from token payload
      const user = await this.userApplicationService.findUserById(
        payload.userId,
      );

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
      const user = await this.userApplicationService.findUserById(
        payload.userId,
      );

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
   * Update user password using User Application Service
   */
  async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.userApplicationService.updateUserPassword(
      userId,
      hashedPassword,
    );
  }

  /**
   * Verify user email using User Application Service
   */
  async verifyUserEmail(userId: string): Promise<void> {
    await this.userApplicationService.verifyEmail(userId);
  }

  /**
   * Check if email exists
   */
  async existsByEmail(email: string): Promise<boolean> {
    return await this.userApplicationService.existsByEmail(email);
  }

  /**
   * Check if username exists
   */
  async existsByUsername(username: string): Promise<boolean> {
    return await this.userApplicationService.existsByUsername(username);
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<User | null> {
    return await this.userApplicationService.findUserById(userId);
  }

  /**
   * Find user by email (direct access to repository method)
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userApplicationService.findUserByEmail(email);
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
    return await this.userApplicationService.createUserFromGoogle(googleData);
  }

  /**
   * Save user (create or update)
   */
  async saveUser(user: User): Promise<void> {
    await this.userApplicationService.saveUser(user);
  }

  /**
   * Generate email verification token for user
   */
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
    await this.userApplicationService.updateLastVerificationSentAt(
      userId,
      timestamp,
    );
  }
}
