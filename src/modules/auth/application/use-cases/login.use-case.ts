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
import { ITokenRepository } from '../interfaces/token-repository.interface';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.module';
import { TOKEN_REPOSITORY_TOKEN } from '../../auth.module';
import { SessionService } from '../../infrastructure/session.repository';
import { TokenService } from '../../infrastructure/token.repository';
import { AuthUserService } from '../auth-user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase extends BaseUseCase<LoginRequest, LoginResult> {
  constructor(
    private authUserService: AuthUserService, // Use auth service wrapper
    private sessionService: SessionService, // Direct injection instead of token
    private tokenService: TokenService, // Direct injection instead of token
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

    // Generate tokens
    const tokens = await this.tokenService.createTokensForUser(
      user.id,
      user.email,
      user.role,
    );

    // Create session
    const sessionId = await this.sessionService.createSession(
      user.id,
      userAgent,
      ipAddress,
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
      sessionId: sessionId,
    };
  }
}
