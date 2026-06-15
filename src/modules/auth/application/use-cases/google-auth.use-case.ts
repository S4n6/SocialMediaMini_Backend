import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { GoogleAuthRequest } from './auth.dtos';
import { LoginResult } from '../../domain/entities';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { ITokenRepository } from '../../domain/repositories/token.repository';
import { ISessionRepository } from '../../domain/repositories/session.repository';
import {
  TOKEN_REPOSITORY_TOKEN,
  SESSION_REPOSITORY_TOKEN,
  EMAIL_SENDER_TOKEN,
} from '../../auth.constants';
import { UserProfile } from '../../../users/domain/value-objects/user-profile.value-object';
import { User, UserRole } from '../../../users/domain/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { IEmailSender } from '../../domain/repositories/email-sender.repository';
import { Email } from '../../domain/value-objects/email.vo';

function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const prismaCode = (error as { code?: unknown }).code;
  const message = (error as { message?: unknown }).message;

  return (
    prismaCode === 'P2002' ||
    (typeof message === 'string' && message.includes('unique constraint'))
  );
}

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
    @Inject(SESSION_REPOSITORY_TOKEN)
    private sessionRepository: ISessionRepository,
    @Inject(EMAIL_SENDER_TOKEN)
    private emailSender: IEmailSender,
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

      // Extract actual sessionId from refresh token
      const sessionInfo =
        await this.sessionRepository.getSessionFromRefreshToken(
          tokens.refreshToken,
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
        sessionId: sessionInfo?.sessionId || 'unknown',
      };
    } else {
      // User doesn't exist, create new user
      let userName = email.split('@')[0]; // Generate username from email
      let userCreated = false;
      let attempts = 0;
      const maxAttempts = 3;

      // Retry loop with exponential backoff to handle race conditions
      while (!userCreated && attempts < maxAttempts) {
        try {
          // Generate username with random suffix if not first attempt
          if (attempts > 0) {
            const randomSuffix = Math.floor(Math.random() * 10000);
            userName = `${email.split('@')[0]}${randomSuffix}`;

            // Exponential backoff: 100ms, 200ms, 400ms
            const backoffDelay = 100 * Math.pow(2, attempts - 1);
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          }

          // Check if username already exists
          const existingUserByUsername =
            await this.userRepository.findByUsername(userName);

          if (existingUserByUsername) {
            attempts++;
            continue; // Try again with new username
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

          // Save user to repository - this may throw on unique constraint violation
          await this.userRepository.save(user);
          userCreated = true;
        } catch (error) {
          // Check if it's a unique constraint violation
          if (isUniqueConstraintError(error)) {
            attempts++;
            if (attempts >= maxAttempts) {
              // Last resort: use UUID suffix (guaranteed unique)
              userName = `${email.split('@')[0]}_${uuidv4().substring(0, 8)}`;

              const profile = new UserProfile({
                fullName: fullName,
                avatar: profilePicture,
              });

              const userId = uuidv4();
              user = new User(userId, userName, email, profile, {
                googleId: googleId,
                isEmailVerified: true,
                role: UserRole.USER,
                emailVerifiedAt: new Date(),
              });

              await this.userRepository.save(user);
              userCreated = true;
            }
          } else {
            // Re-throw non-constraint errors
            throw error;
          }
        }
      }

      // Ensure user was created successfully
      if (!user) {
        throw new Error('Failed to create user after multiple attempts');
      }

      // Generate tokens for new user
      const tokens = await this.tokenRepository.createTokensForUser(
        user.id,
        user.email,
        user.role.toString(),
      );

      try {
        const emailVO = new Email(user.email);
        await this.emailSender.sendWelcomeEmail(emailVO, user.profile.fullName);
      } catch (error) {
        // Login must still succeed even if the welcome email cannot be queued.
        console.error('Failed to send Google welcome email:', error);
      }

      // Extract actual sessionId from refresh token
      const sessionInfo =
        await this.sessionRepository.getSessionFromRefreshToken(
          tokens.refreshToken,
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
        sessionId: sessionInfo?.sessionId || 'unknown',
      };
    }
  }
}
