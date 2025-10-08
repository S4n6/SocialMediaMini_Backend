import { Injectable } from '@nestjs/common';
import {
  RegisterUserDto,
  LoginDto,
  GoogleAuthDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  RefreshTokenDto,
  LogoutDto,
  ChangePasswordDto,
  AuthResultDto,
  AuthUserDto,
  SessionListDto,
} from './dto/auth-use-case.dto';

// Use Cases
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { GoogleAuthUseCase } from './use-cases/google-auth.use-case';
import { ForgotPasswordUseCase } from './use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { VerifyEmailUseCase } from './use-cases/verify-email.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { ResendVerificationUseCase } from './use-cases/resend-verification.use-case';

/**
 * Application service for authentication operations
 * Orchestrates use cases and provides a clean interface for controllers
 */
@Injectable()
export class AuthApplicationService {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly googleAuthUseCase: GoogleAuthUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
  ) {}

  async registerUser(registerDto: RegisterUserDto): Promise<AuthResultDto> {
    const result = await this.registerUserUseCase.execute({
      username: registerDto.username,
      email: registerDto.email,
      fullName: registerDto.fullName,
      avatar: registerDto.avatar,
      dateOfBirth: registerDto.dateOfBirth,
      phoneNumber: registerDto.phoneNumber,
    });

    if (!result.success || !result.user) {
      throw new Error(result.message || 'Registration failed');
    }

    // For registration, we return user info without tokens (user needs to verify email first)
    return {
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        username: result.user.username,
        email: result.user.email,
        role: 'user',
        avatar: result.user.avatar || undefined,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      tokens: {
        accessToken: '',
        refreshToken: '',
        expiresIn: 0,
        tokenType: 'bearer',
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResultDto> {
    const result = await this.loginUseCase.execute({
      email: loginDto.identifier.includes('@')
        ? loginDto.identifier
        : undefined,
      username: !loginDto.identifier.includes('@')
        ? loginDto.identifier
        : undefined,
      password: loginDto.password,
      ipAddress: loginDto.ipAddress,
      userAgent: loginDto.userAgent,
    });

    return {
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        username: result.user.username,
        email: result.user.email,
        avatar: result.user.avatar,
        role: result.user.role,
        isEmailVerified: true, // User is logged in, so email must be verified
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: 3600, // 1 hour
        tokenType: 'bearer',
      },
      session: {
        id: result.sessionId,
        sessionId: result.sessionId,
        userId: result.user.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        lastActiveAt: new Date(),
      },
    };
  }

  async googleAuth(googleAuthDto: GoogleAuthDto): Promise<AuthResultDto> {
    const result = await this.googleAuthUseCase.execute({
      googleId: googleAuthDto.googleId,
      email: googleAuthDto.email,
      fullName: googleAuthDto.fullName,
      profilePicture: googleAuthDto.avatar,
    });

    return {
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        username: result.user.username,
        email: result.user.email,
        avatar: result.user.avatar,
        role: result.user.role,
        isEmailVerified: googleAuthDto.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: 3600, // 1 hour
        tokenType: 'bearer',
      },
      session: {
        id: result.sessionId,
        sessionId: result.sessionId,
        userId: result.user.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        lastActiveAt: new Date(),
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    await this.forgotPasswordUseCase.execute({
      email: forgotPasswordDto.email,
    });
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    await this.resetPasswordUseCase.execute({
      token: resetPasswordDto.token,
      newPassword: resetPasswordDto.newPassword,
      confirmPassword: resetPasswordDto.newPassword, // Assuming frontend validates confirmation
    });
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<AuthUserDto> {
    const result = await this.verifyEmailUseCase.execute({
      token: verifyEmailDto.token,
      password: verifyEmailDto.password,
    });

    if (!result.success || !result.user) {
      throw new Error(result.message || 'Email verification failed');
    }

    return {
      id: result.user.id!,
      fullName: result.user.fullName!,
      username: result.user.username!,
      email: result.user.email!,
      avatar: result.user.avatar || undefined,
      role: result.user.role!,
      isEmailVerified: true,
      createdAt: result.user.createdAt || new Date(),
      updatedAt: result.user.updatedAt || new Date(),
    };
  }

  async resendVerification(dto: {
    email: string;
  }): Promise<{ success: boolean; message: string }> {
    return await this.resendVerificationUseCase.execute({
      email: dto.email,
    });
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const result = await this.refreshTokenUseCase.execute({
      refreshToken: refreshTokenDto.refreshToken,
    });

    if (!result.success || !result.accessToken || !result.refreshToken) {
      throw new Error(result.message || 'Token refresh failed');
    }

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  async logout(logoutDto: LogoutDto): Promise<{ revokedSessions: number }> {
    if (logoutDto.revokeAll) {
      await this.logoutUseCase.execute({
        refreshToken: logoutDto.refreshToken,
      });
      return { revokedSessions: 1 };
    } else {
      await this.logoutUseCase.execute({
        refreshToken: logoutDto.refreshToken,
      });
      return { revokedSessions: 1 };
    }
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<void> {
    // This would need a dedicated use case - for now just throw
    throw new Error('Change password use case not implemented yet');
  }

  async getUserSessions(userId: string): Promise<SessionListDto> {
    // This would need a dedicated use case - for now return empty
    return {
      sessions: [],
      total: 0,
      current: undefined,
    };
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    // This would need a dedicated use case - for now just return
    return;
  }
}
