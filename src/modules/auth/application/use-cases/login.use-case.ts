import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { LoginRequest } from './auth.dtos';
import { LoginResult } from '../../domain/entities';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { ITokenRepository } from '../../domain/repositories/token.repository';
import { ISessionRepository } from '../../domain/repositories/session.repository';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import {
  TOKEN_REPOSITORY_TOKEN,
  SESSION_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
} from '../../auth.constants';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { Password } from '../../domain/value-objects/password.vo';
import { IPasswordHasher } from '../../domain/repositories/password-hasher.repository';
import { SessionDomainService } from '../../domain/services/session-domain.service';
import {
  InvalidCredentialsException,
  EmailNotVerifiedException,
} from '../../domain/exceptions/auth.exceptions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserLoggedInEvent } from '../../domain/events';

@Injectable()
export class LoginUseCase extends BaseUseCase<LoginRequest, LoginResult> {
  constructor(
    private userApplicationService: UserApplicationService,
    @Inject(SESSION_REPOSITORY_TOKEN)
    private sessionService: ISessionRepository, // Use interface with DI token
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private tokenService: ITokenRepository, // Use interface with DI token
    @Inject(PASSWORD_HASHER_TOKEN)
    private passwordHasher: IPasswordHasher,
    private sessionDomainService: SessionDomainService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async execute(request: LoginRequest): Promise<LoginResult> {
    const {
      email,
      username,
      password,
      ipAddress,
      userAgent,
      deviceName,
      deviceType,
    } = request;

    // Find user by email or username
    const identifier = email || username;
    if (!identifier) {
      throw new InvalidCredentialsException();
    }

    // Try to find user by email first, then by username
    const user =
      await this.userApplicationService.findUserEntityByEmailOrUsername(
        identifier,
      );

    if (!user) {
      throw new InvalidCredentialsException();
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new EmailNotVerifiedException(
        'Please verify your email before logging in. Check your email for verification instructions.',
      );
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    // Verify password using IPasswordHasher
    const passwordVO = new Password(password);
    const isPasswordValid = await this.passwordHasher.verify(
      passwordVO,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // Clean up old sessions from same device/user agent
    // Note: TokenRepository.createTokensForUser will create a new session
    // Here we just clean up any existing sessions from this device to avoid accumulation
    if (userAgent) {
      await this.sessionService.deleteSessionsByUserAgent(user.id, userAgent);
    }

    // Generate tokens and session (createTokensForUser already creates the session)
    const tokens = await this.tokenService.createTokensForUser(
      user.id,
      user.email,
      user.role,
      userAgent,
      ipAddress,
      deviceName,
      deviceType,
    );

    // Extract sessionId from refresh token for compatibility
    const sessionInfo = await this.sessionService.getSessionFromRefreshToken(
      tokens.refreshToken,
    );

    // Emit UserLoggedInEvent for side effects (audit logging, etc.)
    this.eventEmitter.emit(
      'auth.user.logged-in',
      new UserLoggedInEvent(user.id, user.email, ipAddress, userAgent),
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
