import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleUserDto } from './dto/google-auth.dto';
import { UserManagementService } from './repositories/user-management.repository';
import { AuthenticationService } from './repositories/authentication.repository';
import { SessionService } from './repositories/session.repository';
import { TokenService } from './repositories/token.repository';
import { RedisCacheService } from '../cache/cache.service';
import { NotificationGateway } from '../notification';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userManagementService: UserManagementService,
    private authenticationService: AuthenticationService,
    private sessionService: SessionService,
    private tokenService: TokenService,
    private cacheService: RedisCacheService,
    private notificationGateway: NotificationGateway,
  ) {}

  // ===== USER REGISTRATION & EMAIL VERIFICATION =====

  async register(registerDto: RegisterDto) {
    return this.userManagementService.registerUser(registerDto);
  }

  async verifyEmail(token: string, password?: string) {
    return this.userManagementService.verifyEmail(token, password);
  }

  async resendVerificationEmail(email: string) {
    return this.userManagementService.resendVerificationEmail(email);
  }

  // ===== PASSWORD MANAGEMENT =====

  async forgotPassword(email: string) {
    return this.userManagementService.forgotPassword(email);
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    return this.userManagementService.resetPassword(
      token,
      newPassword,
      confirmPassword,
    );
  }

  // ===== AUTHENTICATION =====

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const result = await this.authenticationService.login(
      loginDto,
      ipAddress,
      userAgent,
    );

    // Send notification
    if (result.success && result.user) {
      this.notificationGateway.broadcast({
        userId: result.user.id,
        message: 'User logged in',
      });
    }

    return result;
  }

  async logout(sessionId: string, userId: string) {
    return this.authenticationService.logout(sessionId, userId);
  }

  async logoutAllDevices(userId: string, currentSessionId?: string) {
    return this.authenticationService.logoutAllDevices(
      userId,
      currentSessionId,
    );
  }

  // ===== TOKEN MANAGEMENT =====

  async refreshAccessToken(refreshToken: string) {
    return this.tokenService.refreshAccessToken(refreshToken);
  }

  async revokeRefreshToken(refreshToken: string) {
    return this.tokenService.revokeRefreshToken(refreshToken);
  }

  async validateAccessToken(token: string) {
    return this.authenticationService.validateAccessToken(token);
  }

  async revokeToken(token: string, tokenType: 'access' | 'refresh' = 'access') {
    return this.authenticationService.revokeToken(token, tokenType);
  }

  // ===== SESSION MANAGEMENT =====

  async getUserSessions(userId: string) {
    // Mock implementation - should be implemented in SessionService
    return { sessions: [], total: 0 };
  }

  async cleanupZombieSessions(userId: string) {
    // Mock implementation - should be implemented in SessionService
    return { message: 'Zombie sessions cleaned up', cleaned: 0 };
  }

  async cleanupAllZombieSessions(inactiveDays?: number) {
    // Mock implementation - should be implemented in SessionService
    return { message: 'All zombie sessions cleaned up', cleaned: 0 };
  }

  async revokeUserSessions(userId: string, sessionIds: string[]) {
    return this.sessionService.deleteSessions(userId, sessionIds);
  }

  async revokeAllUserSessions(userId: string) {
    // Get all user sessions first
    const userSessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
      },
      select: {
        id: true,
        sessionId: true,
      },
    });

    if (userSessions.length === 0) {
      return {
        message: 'No active sessions found to revoke',
        revokedCount: 0,
      };
    }

    // Delete all sessions for the user
    const deleteResult = await this.prisma.session.deleteMany({
      where: {
        userId,
        isRevoked: false,
      },
    });

    // Also revoke all user tokens
    await this.tokenService.revokeAllUserTokens(userId);

    return {
      message: `Successfully revoked all ${deleteResult.count} sessions`,
      revokedCount: deleteResult.count,
      sessionIds: userSessions.map((s) => s.sessionId),
    };
  }

  async cleanupExpiredTokens() {
    // Mock implementation - should be implemented in TokenService
    return { message: 'Expired tokens cleaned up successfully', count: 0 };
  }

  async verifyGoogleToken(idToken: string) {
    // Mock implementation - should be implemented for Google OAuth
    throw new Error('Google token verification not implemented yet');
  }

  // ===== GOOGLE AUTHENTICATION =====

  async googleLogin(googleUser: GoogleUserDto) {
    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      // User exists, create tokens and login
      const tokens = await this.tokenService.createTokensForUser(
        user.id,
        user.email,
      );

      this.notificationGateway.broadcast({
        userId: user.id,
        message: 'User logged in via Google',
      });

      return {
        success: true,
        message: 'Google login successful',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
          fullName: user.fullName,
          avatar: user.avatar,
          role: user.role,
        },
      };
    } else {
      // User doesn't exist, create new user
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          fullName: googleUser.fullName,
          avatar: googleUser.profilePicture,
          isEmailVerified: true, // Google accounts are pre-verified
          emailVerifiedAt: new Date(),
          // Generate a username from email
          userName: googleUser.email.split('@')[0],
        },
      });

      const tokens = await this.tokenService.createTokensForUser(
        user.id,
        user.email,
      );

      this.notificationGateway.broadcast({
        userId: user.id,
        message: 'New user registered via Google',
      });

      return {
        success: true,
        message: 'Google registration and login successful',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
          fullName: user.fullName,
          avatar: user.avatar,
          role: user.role,
        },
      };
    }
  }

  // ===== VALIDATE USER (used by strategies) =====

  /**
   * Validate user by id for authentication strategies (JWT)
   * Returns user object (minimal public fields) or null if not found / not verified
   */
  async validateUserById(userId: string) {
    if (!userId) return null;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userName: true,
        role: true,
        fullName: true,
        avatar: true,
        isEmailVerified: true,
      },
    });

    // Reject users who haven't verified email
    if (!user || !user.isEmailVerified) return null;

    return user;
  }

  // ===== UTILITY METHODS =====

  async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ userId: string; email: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // Use SessionService to get session info from refresh token
      const sessionInfo =
        await this.sessionService.getSessionFromRefreshToken(refreshToken);

      // Get user info from session
      const session = await this.prisma.session.findUnique({
        where: { id: sessionInfo.id },
        include: { user: true },
      });

      if (!session || session.isRevoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return {
        userId: session.userId,
        email: session.user.email,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
