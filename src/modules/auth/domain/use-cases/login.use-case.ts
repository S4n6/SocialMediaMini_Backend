import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { LoginRequest } from './auth.dtos';
import { LoginResult } from '../entities';
import { IUserRepository, ISessionRepository, ITokenRepository } from '../repositories';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase extends BaseUseCase<LoginRequest, LoginResult> {
  constructor(
    private userRepository: IUserRepository,
    private sessionRepository: ISessionRepository,
    private tokenRepository: ITokenRepository,
  ) {
    super();
  }

  async execute(request: LoginRequest): Promise<LoginResult> {
    const { email, userName, password, ipAddress, userAgent } = request;

    // Find user by email or username
    const identifier = email || userName;
    if (!identifier) {
      throw new UnauthorizedException('Email or username is required');
    }

    const user = await this.userRepository.findUserByEmailOrUsername(identifier);
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
    if (!user.password) {
      throw new UnauthorizedException(
        'No password set for this account. Please use social login or reset your password.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.tokenRepository.createTokensForUser(
      user.id,
      user.email,
      user.role,
    );

    // Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session = await this.sessionRepository.createSession({
      sessionId,
      userId: user.id,
      refreshToken: tokens.refreshToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: session.sessionId,
    };
  }
}