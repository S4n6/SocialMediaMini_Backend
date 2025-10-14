import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { LoginRequest } from './auth.dtos';
import { LoginResult } from '../../domain/entities';
import { IUserRepository } from '../../../users/application';
import { ITokenRepository } from '../interfaces/token.repository.interface';
import { ISessionRepository } from '../interfaces/session.repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import {
  TOKEN_REPOSITORY_TOKEN,
  SESSION_REPOSITORY_TOKEN,
} from '../../auth.constants';
import { AuthUserService } from '../auth-user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase extends BaseUseCase<LoginRequest, LoginResult> {
  constructor(
    @Inject('AUTH_USER_SERVICE') // Use token for consistency
    private authUserService: AuthUserService, // Use auth service wrapper
    @Inject(SESSION_REPOSITORY_TOKEN)
    private sessionService: ISessionRepository, // Use interface with DI token
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private tokenService: ITokenRepository, // Use interface with DI token
  ) {
    super();
  }

  async execute(request: LoginRequest): Promise<LoginResult> {
    const { email, username, password, ipAddress, userAgent } = request;

    // Find user by email or username
    const identifier = email || username;
    if (!identifier) {
      throw new UnauthorizedException('Email or username is required');
    }

    // Try to find user by email first, then by username
    const user =
      await this.authUserService.findUserByEmailOrUsername(identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in. Check your email for verification instructions.',
      );
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'No password set for this account. Please use social login or reset your password.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
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
      sessionId: sessionInfo.sessionId, // Extract sessionId from refresh token for compatibility
    };
  }
}
