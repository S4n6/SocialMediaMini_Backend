import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { GoogleAuthRequest } from './auth.dtos';
import { LoginResult } from '../../domain/entities';
import { ROLES } from '../../../../shared/constants/roles.constant';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { ITokenRepository } from '../../domain/repositories/token.repository';
import { TOKEN_REPOSITORY_TOKEN } from '../../auth.constants';
import {
  UserEmail,
  Username,
  UserId,
} from '../../../users/domain/value-objects';
import { UserProfile } from '../../../users/domain/value-objects/user-profile.value-object';
import { User, UserRole } from '../../../users/domain/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GoogleAuthUseCase extends BaseUseCase<
  GoogleAuthRequest,
  LoginResult
> {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private userRepository: IUserRepository,
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private tokenRepository: ITokenRepository,
  ) {
    super();
  }

  async execute(request: GoogleAuthRequest): Promise<LoginResult> {
    const { googleId, email, fullName, profilePicture } = request;

    // Check if user exists
    let user = await this.userRepository.findByEmail(email);

    if (user) {
      // User exists, generate tokens and return
      const tokens = await this.tokenRepository.createTokensForUser(
        user.id,
        user.email,
        user.role.toString(),
      );

      return {
        success: true,
        message: 'Google login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.profile.fullName,
          avatar: user.profile.avatar,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionId: `google_session_${Date.now()}`,
      };
    } else {
      // User doesn't exist, create new user
      let userName = email.split('@')[0]; // Generate username from email

      // Check if username already exists with retry logic
      let attempts = 0;
      const maxAttempts = 5;
      let existingUserByUsername =
        await this.userRepository.findByUsername(userName);

      while (existingUserByUsername && attempts < maxAttempts) {
        // Try with random suffix (3-4 digits)
        const randomSuffix = Math.floor(Math.random() * 10000);
        userName = `${email.split('@')[0]}${randomSuffix}`;
        existingUserByUsername =
          await this.userRepository.findByUsername(userName);
        attempts++;
      }

      // If still colliding after max attempts, use UUID suffix (guaranteed unique)
      if (existingUserByUsername) {
        userName = `${email.split('@')[0]}_${uuidv4().substring(0, 8)}`;
      }

      // Create user profile
      const profile = new UserProfile({
        fullName: fullName,
        avatar: profilePicture,
      });

      // Create new user
      const userId = uuidv4();
      user = new User(userId, userName, email, profile, {
        googleId: googleId,
        isEmailVerified: true, // Google accounts are pre-verified
        role: UserRole.USER,
        emailVerifiedAt: new Date(),
      });

      // Save user to repository
      await this.userRepository.save(user);

      // Generate tokens for new user
      const tokens = await this.tokenRepository.createTokensForUser(
        user.id,
        user.email,
        user.role.toString(),
      );

      return {
        success: true,
        message: 'Google registration and login successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.profile.fullName,
          avatar: user.profile.avatar,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        sessionId: `google_session_${Date.now()}`,
      };
    }
  }
}
