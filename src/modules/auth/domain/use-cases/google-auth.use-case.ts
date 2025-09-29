import { Injectable, ConflictException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { GoogleAuthRequest } from './auth.dtos';
import { LoginResult } from '../entities';
import { IUserRepository, ITokenRepository } from '../repositories';
import { ROLES } from '../../../../constants/roles.constant';

@Injectable()
export class GoogleAuthUseCase extends BaseUseCase<
  GoogleAuthRequest,
  LoginResult
> {
  constructor(
    private userRepository: IUserRepository,
    private tokenRepository: ITokenRepository,
  ) {
    super();
  }

  async execute(request: GoogleAuthRequest): Promise<LoginResult> {
    const { email, fullName, profilePicture } = request;

    // Check if user exists
    let user = await this.userRepository.findUserByEmail(email);

    if (user) {
      // User exists, generate tokens and return
      const tokens = await this.tokenRepository.createTokensForUser(
        user.id,
        user.email,
        user.role,
      );

      return {
        success: true,
        message: 'Google login successful',
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
        sessionId: `google_session_${Date.now()}`, // Temporary session ID
      };
    } else {
      // User doesn't exist, create new user
      let userName = email.split('@')[0]; // Generate username from email

      // Check if username already exists
      const existingUserByUsername =
        await this.userRepository.findUserByUsername(userName);
      if (existingUserByUsername) {
        // Use email prefix with random number if username taken
        const randomSuffix = Math.floor(Math.random() * 1000);
        userName = `${email.split('@')[0]}${randomSuffix}`;
      }

      user = await this.userRepository.createUser({
        email,
        fullName,
        userName,
        avatar: profilePicture,
        isEmailVerified: true, // Google accounts are pre-verified
        role: ROLES.USER,
      });

      const tokens = await this.tokenRepository.createTokensForUser(
        user.id,
        user.email,
        user.role,
      );

      return {
        success: true,
        message: 'Google registration and login successful',
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
        sessionId: `google_session_${Date.now()}`, // Temporary session ID
      };
    }
  }
}
