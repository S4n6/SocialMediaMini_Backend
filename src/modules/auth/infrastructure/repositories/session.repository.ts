import { Injectable } from '@nestjs/common';
import { ISessionRepository } from '../../application/interfaces/session.repository.interface';
import { AuthSession } from '../../domain/entities/session.entity';
import { Token } from '../../domain/value-objects/token.vo';
import { PrismaService } from '../../../../database/prisma.service';

/**
 * Prisma Session Repository Implementation
 * Implements ISessionRepository using Prisma ORM
 */
@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Overload: create from AuthSession entity
  async create(session: AuthSession): Promise<AuthSession>;
  // Overload: create from simple parameters (replaces createSession)
  async create(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string>;
  async create(
    sessionOrUserId: AuthSession | string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthSession | string> {
    // If first parameter is a string (userId), create session from parameters
    if (typeof sessionOrUserId === 'string') {
      const userId = sessionOrUserId;

      // Generate unique database ID and refresh token
      const databaseId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const refreshToken = new Token(
        this.generateRefreshToken(userId, databaseId),
      );

      // Create a new AuthSession domain entity - sessionId will be generated from refresh token hash
      const sessionData = {
        id: databaseId,
        userId,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      const session = AuthSession.create(sessionData);
      const createdSession = await this.create(session);

      // Return the refresh token
      return createdSession.refreshToken.value;
    }

    // If first parameter is AuthSession object, use original logic
    const session = sessionOrUserId;
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

  async findByRefreshToken(refreshToken: string): Promise<AuthSession | null> {
    const sessionId = AuthSession.generateSessionId(refreshToken);
    return this.findBySessionId(sessionId);
  }

  async findBySessionId(sessionId: string): Promise<AuthSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { sessionId: sessionId },
    });

    return session ? this.mapToDomain(session) : null;
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

  async deleteSessions(userId: string, sessionIds: string[]): Promise<void> {
    await this.prisma.session.deleteMany({
      where: {
        userId: userId,
        id: {
          in: sessionIds,
        },
      },
    });
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
    // Use the new sessionId hashing approach
    try {
      const sessionId = AuthSession.generateSessionId(refreshToken);
      const session = await this.findBySessionId(sessionId);

      if (session) {
        return {
          sessionId: session.sessionId,
          userId: session.userId,
          isValid: session.isValid(),
        };
      }

      // If session not found, try to decode refresh token for backward compatibility
      const tokenParts = refreshToken.split('.');
      if (tokenParts.length >= 2) {
        const payload = JSON.parse(
          Buffer.from(tokenParts[1], 'base64').toString(),
        );
        return {
          sessionId: payload.sessionId || sessionId,
          userId: payload.sub,
          isValid: false,
        };
      }

      return {
        sessionId: sessionId,
        userId: 'unknown',
        isValid: false,
      };
    } catch (error) {
      console.error('Error getting session from refresh token:', error);
      return {
        sessionId: AuthSession.generateSessionId(refreshToken),
        userId: 'unknown',
        isValid: false,
      };
    }
  }

  async verifyAndUpdateSession(refreshToken: string): Promise<any> {
    try {
      // Use the new sessionId hashing approach
      const session = await this.findByRefreshToken(refreshToken);

      if (session && session.isValid()) {
        // Update lastUsedAt timestamp
        await this.prisma.session.update({
          where: { sessionId: session.sessionId },
          data: { lastUsedAt: new Date() },
        });

        return {
          sessionId: session.sessionId,
          userId: session.userId,
          isValid: true,
        };
      }

      return { isValid: false };
    } catch (error) {
      console.error('Error verifying and updating session:', error);
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
