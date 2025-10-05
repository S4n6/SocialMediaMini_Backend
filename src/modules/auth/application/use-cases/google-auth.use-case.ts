import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { GoogleAuthRequest } from './auth.dtos';
import { LoginResult } from '../../domain/entities';
import { ROLES } from '../../../../shared/constants/roles.constant';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.module';
import { IUserRepository } from 'src/modules/users/application';
import { ITokenRepository } from '../interfaces/token.repository.interface';

@Injectable()
export class GoogleAuthUseCase extends BaseUseCase<
  GoogleAuthRequest,
  LoginResult
> {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private userRepository: IUserRepository,
    @Inject('TOKEN_REPOSITORY')
    private tokenRepository: ITokenRepository,
  ) {
    super();
  }

  async execute(request: GoogleAuthRequest): Promise<LoginResult> {
    const { email, fullName, profilePicture } = request;

    // Check if user exists
    let user = await this.userRepository.findByEmail(email);

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
          username: user.username,
          fullName: user.profile.fullName,
          avatar: user.profile.avatar,
          role: user.role,
        },
        // Note: tokens is AuthToken class, need to extract actual token values
        // This needs to be fixed based on actual implementation
        accessToken: 'placeholder_access_token',
        refreshToken: 'placeholder_refresh_token',
        sessionId: `google_session_${Date.now()}`, // Temporary session ID
      };
    }

    return {
      success: true,
      message: 'Google registration and login successful',
      user: {
        id: 'new_user_id', // Placeholder, replace with actual user ID after creation
        email: email,
        username: email.split('@')[0], // Placeholder, generate or ask for username later
        fullName: fullName,
        avatar: profilePicture,
        role: ROLES.USER,
      },
      accessToken: '',
      refreshToken: '',
      sessionId: `google_session_${Date.now()}`, // Temporary session ID
    };

    //else {
    //   // User doesn't exist, create new user
    //   let userName = email.split('@')[0]; // Generate username from email

    //   // Check if username already exists
    //   const existingUserByUsername =
    //     await this.userRepository.findUserByUsername(userName);
    //   if (existingUserByUsername) {
    //     // Use email prefix with random number if username taken
    //     const randomSuffix = Math.floor(Math.random() * 1000);
    //     userName = `${email.split('@')[0]}${randomSuffix}`;
    //   }

    //   user = await this.userRepository.createUser({
    //     email,
    //     fullName: fullName,
    //     username: userName,
    //     avatar: profilePicture,
    //     isEmailVerified: true, // Google accounts are pre-verified
    //     role: ROLES.USER,
    //   });

    //   const tokens = await this.tokenRepository.createTokensForUser(
    //     user.id,
    //     user.email,
    //     user.role,
    //   );

    //   return {
    //     success: true,
    //     message: 'Google registration and login successful',
    //     user: {
    //       id: user.id,
    //       email: user.email,
    //       username: user.username,
    //       fullName: user.fullName,
    //       avatar: user.avatar,
    //       role: user.role,
    //     },
    //     accessToken: tokens.accessToken,
    //     refreshToken: tokens.refreshToken,
    //     sessionId: `google_session_${Date.now()}`, // Temporary session ID
    //   };
    // }
  }
}
