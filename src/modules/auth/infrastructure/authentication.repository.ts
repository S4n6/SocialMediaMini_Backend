import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ISessionRepository } from '../application/interfaces/session.repository.interface';
import { ITokenRepository } from '../application/interfaces/token.repository.interface';
import { RedisCacheService } from '../../cache/cache.service';
import { LoginRequest as LoginDto } from '../application/use-cases/auth.dtos';
import {
  SESSION_REPOSITORY_TOKEN,
  TOKEN_REPOSITORY_TOKEN,
} from '../auth.constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthenticationService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(SESSION_REPOSITORY_TOKEN)
    private sessionService: ISessionRepository,
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private tokenService: ITokenRepository,
    private cacheService: RedisCacheService,
  ) {}

  // ===== LOGIN =====

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, username, password } = loginDto;

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(username ? [{ username }] : [])],
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatar: true,
        role: true,
        status: true,
        isEmailVerified: true,
        passwordHash: true, // Include password for authentication
        dateOfBirth: true,
        emailVerifiedAt: true,
      },
    });

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
      throw new BadRequestException(
        'Password not set. Please complete email verification to set your password.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create tokens
    const tokens = await this.createTokensForUser(
      user.id,
      user.email,
      userAgent,
      ipAddress,
    );

    return {
      success: true,
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        userName: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        isEmailVerified: user.isEmailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    };
  }

  private async createTokensForUser(
    userId: string,
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.sessionService.createSession(
      userId,
      userAgent,
      ipAddress,
    );

    return { accessToken, refreshToken };
  }

  // ===== LOGOUT =====

  async logout(sessionId: string, userId: string) {
    // Verify session belongs to user
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        isRevoked: false,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // Delete the session
    await this.sessionService.deleteSession(sessionId);

    return { message: 'Logged out successfully' };
  }

  // ===== LOGOUT ALL DEVICES =====

  async logoutAllDevices(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        ...(currentSessionId && { id: { not: currentSessionId } }),
      },
    });

    // Delete all sessions
    const sessionIds = sessions.map((session) => session.id);
    await this.sessionService.deleteSessions(userId, sessionIds);

    return {
      message: currentSessionId
        ? 'Logged out from all other devices successfully'
        : 'Logged out from all devices successfully',
      sessionsRevoked: sessions.length,
    };
  }

  // ===== VALIDATE TOKEN =====

  async validateAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      // Check if token is blacklisted
      const isBlacklisted = await this.cacheService.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: true,
          isEmailVerified: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isEmailVerified) {
        throw new UnauthorizedException('Email not verified');
      }

      return { user, payload };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid access token');
      }
      throw error;
    }
  }

  // ===== HELPER METHODS =====

  private generateDeviceFingerprint(
    ipAddress?: string,
    userAgent?: string,
  ): string {
    const components = [
      ipAddress || 'unknown-ip',
      userAgent || 'unknown-agent',
      Date.now().toString(),
    ];

    return Buffer.from(components.join('|')).toString('base64');
  }

  // ===== REVOKE TOKEN =====

  async revokeToken(token: string, tokenType: 'access' | 'refresh' = 'access') {
    if (tokenType === 'access') {
      // Add to blacklist cache
      const payload = this.jwtService.decode(token);
      if (payload && payload.exp) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.cacheService.set(`blacklist:${token}`, true, ttl);
        }
      }
    } else {
      // Revoke refresh token
      await this.tokenService.revokeRefreshToken(token);
    }

    return { message: 'Token revoked successfully' };
  }
}
