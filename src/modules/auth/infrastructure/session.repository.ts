import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { JWT } from 'src/config/jwt.config';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  // ===== SESSION GENERATION =====

  generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateRefreshToken(sessionId: string): string {
    const payload = { sessionId, timestamp: Date.now() };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  // ===== SESSION CRUD =====

  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const sessionId = this.generateSessionId();

    // Calculate expiry date from JWT config
    const expiresAt = new Date();
    const expiryTime = JWT.REFRESH_EXPIRES_IN;

    if (expiryTime.endsWith('d')) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryTime));
    } else if (expiryTime.endsWith('h')) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiryTime));
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await this.prisma.session.create({
      data: {
        sessionId,
        userId,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return this.generateRefreshToken(sessionId);
  }

  async getSessionFromRefreshToken(
    refreshToken: string,
  ): Promise<{ sessionId: string; id: string }> {
    try {
      const tokenPayload = JSON.parse(
        Buffer.from(refreshToken, 'base64').toString(),
      );
      const { sessionId } = tokenPayload;

      if (!sessionId) {
        throw new UnauthorizedException('Invalid refresh token format');
      }

      const session = await this.prisma.session.findUnique({
        where: { sessionId },
        select: { id: true, sessionId: true },
      });

      if (!session) {
        throw new UnauthorizedException('Session not found');
      }

      return session;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyAndUpdateSession(
    refreshToken: string,
  ): Promise<{ userId: string; email: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      const tokenPayload = JSON.parse(
        Buffer.from(refreshToken, 'base64').toString(),
      );
      const { sessionId } = tokenPayload;

      if (!sessionId) {
        throw new UnauthorizedException('Invalid refresh token format');
      }

      const session = await this.prisma.session.findUnique({
        where: { sessionId },
        include: { user: true },
      });

      if (!session) {
        throw new UnauthorizedException(
          'Session not found. Please log in again.',
        );
      }

      if (session.isRevoked) {
        throw new UnauthorizedException(
          'Session has been revoked. Please log in again.',
        );
      }

      if (session.expiresAt < new Date()) {
        await this.deleteSession(session.sessionId);
        throw new UnauthorizedException(
          'Session has expired. Please log in again.',
        );
      }

      // Update last used timestamp
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        userId: session.userId,
        email: session.user.email,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Invalid refresh token. Please log in again.',
      );
    }
  }

  async rotateRefreshToken(sessionId: string): Promise<string> {
    const newRefreshToken = this.generateRefreshToken(sessionId);

    const expiresAt = new Date();
    const expiryTime = JWT.REFRESH_EXPIRES_IN;

    if (expiryTime.endsWith('d')) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryTime));
    } else if (expiryTime.endsWith('h')) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiryTime));
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await this.prisma.session.update({
      where: { sessionId },
      data: {
        lastUsedAt: new Date(),
        expiresAt: expiresAt,
      },
    });

    return newRefreshToken;
  }

  // ===== SESSION DELETION =====

  async deleteSession(refreshTokenOrSessionId: string): Promise<void> {
    try {
      // Try to parse as refresh token first
      const tokenPayload = JSON.parse(
        Buffer.from(refreshTokenOrSessionId, 'base64').toString(),
      );
      const { sessionId } = tokenPayload;

      if (sessionId) {
        await this.prisma.session.deleteMany({
          where: { sessionId, isRevoked: false },
        });
      }
    } catch (error) {
      // If parsing fails, treat as sessionId directly
      await this.prisma.session.deleteMany({
        where: { sessionId: refreshTokenOrSessionId, isRevoked: false },
      });
    }
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId, isRevoked: false },
    });
  }

  async deleteSessions(userId: string, sessionIds: string[]) {
    const deleteResult = await this.prisma.session.deleteMany({
      where: {
        userId,
        sessionId: { in: sessionIds },
        isRevoked: false,
      },
    });

    return { revokedCount: deleteResult.count };
  }
}
