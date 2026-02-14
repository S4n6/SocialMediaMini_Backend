import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { LoginRequest } from './auth.dtos';
import { LoginResult } from '../../domain/entities';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { ITokenRepository } from '../../domain/repositories/token.repository';
import { ISessionRepository } from '../../domain/repositories/session.repository';
import { IPasswordHasher } from '../../domain/repositories/password-hasher.repository';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import {
  TOKEN_REPOSITORY_TOKEN,
  SESSION_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
} from '../../auth.constants';
import { UserApplicationService } from '../../../users/application/user-application.service';
import {
  InvalidPasswordException,
  UserNotVerifiedException,
} from '../../domain/exceptions/auth.exceptions';
import { Password } from '../../domain/value-objects/password.vo';

@Injectable()
export class LoginUseCase extends BaseUseCase<LoginRequest, LoginResult> {
  constructor(
    private userApplicationService: UserApplicationService,
    @Inject(SESSION_REPOSITORY_TOKEN)
    private sessionService: ISessionRepository, // Use interface with DI token
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private tokenService: ITokenRepository, // Use interface with DI token
    @Inject(PASSWORD_HASHER_TOKEN)
    private passwordHasher: IPasswordHasher, // Use interface with DI token
  ) {
    super();
  }

  async execute(request: LoginRequest): Promise<LoginResult> {
    const { email, username, password, ipAddress, userAgent } = request;

    // Find user by email or username
    const identifier = email || username;
    if (!identifier) {
      throw new InvalidPasswordException();
    }

    // Try to find user by email first, then by username
    const user =
      await this.userApplicationService.findUserEntityByEmailOrUsername(
        identifier,
      );

    if (!user) {
      throw new InvalidPasswordException();
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UserNotVerifiedException();
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      throw new InvalidPasswordException();
    }

    // Verify password
    const passwordVO = new Password(password);
    const isPasswordValid = await this.passwordHasher.verify(
      passwordVO,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new InvalidPasswordException();
    }

    // Clean up old sessions from same device/user agent
    if (userAgent) {
      // Delete sessions from the same device (userAgent)
      await this.sessionService.deleteSessionsByUserAgent(user.id, userAgent);
    } else {
      // If no userAgent provided, clean all sessions (fallback to prevent session accumulation)
      await this.sessionService.deleteAllByUserId(user.id);
    }

    // Generate tokens and session (createTokensForUser already creates the session)
    const tokens = await this.tokenService.createTokensForUser(
      user.id,
      user.email,
      user.role,
      userAgent,
      ipAddress,
    );

    // Extract sessionId from refresh token for compatibility
    const sessionInfo = await this.sessionService.getSessionFromRefreshToken(
      tokens.refreshToken,
    );

    return {
      success: true,
      message: 'Login successful',
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
      sessionId: sessionInfo?.sessionId || 'unknown', // Extract sessionId from refresh token for compatibility
    };
  }
}
