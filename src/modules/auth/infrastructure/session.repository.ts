import { Injectable } from '@nestjs/common';
import { ISessionRepository } from '../application/interfaces/session.repository.interface';
import { AuthSession } from '../domain/entities/session.entity';
import { Token } from '../domain/value-objects/token.vo';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Prisma Session Repository Implementation
 * Implements ISessionRepository using Prisma ORM
 */
@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(session: AuthSession): Promise<AuthSession> {
    const sessionData = session.toPlainObject();

    const createdSession = await this.prisma.session.create({
      data: {
        id: sessionData.id,
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        isRevoked: sessionData.isRevoked,
        createdAt: sessionData.createdAt,
        expiresAt: sessionData.expiresAt,
      },
    });

    // Since refresh token isn't stored in Session table, we need to handle it separately
    // For now, we'll create the domain object with the original refresh token
    return AuthSession.fromPersistence({
      id: createdSession.id,
      sessionId: createdSession.sessionId,
      userId: createdSession.userId,
      refreshToken: session.refreshToken,
      ipAddress: createdSession.ipAddress,
      userAgent: createdSession.userAgent,
      isRevoked: createdSession.isRevoked,
      createdAt: createdSession.createdAt,
      expiresAt: createdSession.expiresAt,
      revokedAt: null, // New sessions are not revoked
    });
  }

  async findById(sessionId: string): Promise<AuthSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    return session ? this.mapToDomain(session) : null;
  }

  async findByUserId(userId: string): Promise<AuthSession[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => this.mapToDomain(session));
  }

  async update(
    sessionId: string,
    updates: Partial<AuthSession>,
  ): Promise<AuthSession> {
    const updateData: any = {};

    if (updates.isRevoked !== undefined) {
      updateData.isRevoked = updates.isRevoked;
    }
    if (updates.revokedAt !== undefined) {
      updateData.revokedAt = updates.revokedAt;
    }
    if (updates.expiresAt !== undefined) {
      updateData.expiresAt = updates.expiresAt;
    }

    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: updateData,
    });

    return this.mapToDomain(updatedSession);
  }

  async delete(sessionId: string): Promise<void> {
    await this.prisma.session.delete({
      where: { id: sessionId },
    });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired(): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });
  }

  async isValidSession(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return false;
    }

    const domainSession = this.mapToDomain(session);
    return domainSession.isValid();
  }

  async extendSession(sessionId: string, newExpiryDate: Date): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt: newExpiryDate },
    });
  }

  /**
   * Map Prisma session to Domain Session entity
   * Note: This requires refreshToken to be provided separately since it's not in Prisma schema
   */
  private mapToDomain(prismaSession: any, refreshToken?: Token): AuthSession {
    // For sessions retrieved from database, we need to get the refresh token separately
    // This is a limitation of the current schema design
    const token = refreshToken || new Token('placeholder_token'); // This needs proper implementation

    return AuthSession.fromPersistence({
      id: prismaSession.id,
      sessionId: prismaSession.sessionId,
      userId: prismaSession.userId,
      refreshToken: token,
      ipAddress: prismaSession.ipAddress,
      userAgent: prismaSession.userAgent,
      isRevoked: prismaSession.isRevoked,
      createdAt: prismaSession.createdAt,
      expiresAt: prismaSession.expiresAt,
      revokedAt: prismaSession.revokedAt || null,
    });
  }

  // High-level business operations
  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    // TODO: Implement session creation with refresh token
    throw new Error('Method not implemented.');
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.delete(sessionId);
  }

  async deleteSessions(userId: string, sessionIds: string[]): Promise<void> {
    // TODO: Implement batch delete
    throw new Error('Method not implemented.');
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.deleteAllByUserId(userId);
  }

  async deleteSessionsByUserAgent(
    userId: string,
    userAgent: string,
  ): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        userId: userId,
        userAgent: userAgent,
      },
    });
  }

  async getSessionFromRefreshToken(refreshToken: string): Promise<any> {
    // Since refresh tokens are stored as part of the session creation process,
    // we need to decode the refresh token to get session info
    try {
      // For simplicity, assuming refresh token contains session info
      // In a real implementation, this would involve JWT verification
      const tokenParts = refreshToken.split('.');
      if (tokenParts.length >= 2) {
        const payload = JSON.parse(
          Buffer.from(tokenParts[1], 'base64').toString(),
        );
        return {
          sessionId: payload.sessionId || `session_${Date.now()}`,
          userId: payload.sub,
        };
      }

      // Fallback: generate session info
      return {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: 'unknown',
      };
    } catch (error) {
      console.error('Error decoding refresh token:', error);
      return {
        sessionId: `session_${Date.now()}_fallback`,
        userId: 'unknown',
      };
    }
  }

  async verifyAndUpdateSession(refreshToken: string): Promise<any> {
    try {
      // Parse refresh token to get session info
      const tokenParts = refreshToken.split('.');
      if (tokenParts.length >= 2) {
        const payload = JSON.parse(
          Buffer.from(tokenParts[1], 'base64').toString(),
        );

        // Find and verify session
        const session = await this.prisma.session.findFirst({
          where: {
            sessionId: payload.sessionId,
            userId: payload.sub,
            isRevoked: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        });

        if (session) {
          return {
            sessionId: session.sessionId,
            userId: session.userId,
            isValid: true,
          };
        }
      }

      return { isValid: false };
    } catch (error) {
      console.error('Error verifying session:', error);
      return { isValid: false };
    }
  }

  async rotateRefreshToken(sessionId: string, userId: string): Promise<string> {
    // Generate new refresh token
    const newRefreshToken = this.generateRefreshToken(userId, sessionId);

    // Log rotation for audit
    console.log('Rotated refresh token for session:', sessionId);

    return newRefreshToken;
  }

  private generateRefreshToken(userId: string, sessionId: string): string {
    const payload = {
      sub: userId,
      sessionId: sessionId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    const header = Buffer.from(
      JSON.stringify({ typ: 'JWT', alg: 'HS256' }),
    ).toString('base64');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${header}.${payloadStr}.refresh_signature`;
  }
}
