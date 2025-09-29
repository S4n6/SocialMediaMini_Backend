import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ISessionRepository } from '../domain/repositories';
import {
  AuthSession,
  AuthSessionCreationData,
  AuthSessionUpdateData,
} from '../domain/entities';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(private prisma: PrismaService) {}

  async createSession(
    sessionData: AuthSessionCreationData,
  ): Promise<AuthSession> {
    const session = await this.prisma.session.create({
      data: {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        expiresAt: sessionData.expiresAt,
        isRevoked: false,
      },
    });

    return this.mapPrismaSessionToEntity(session, sessionData.refreshToken);
  }

  async findSessionById(id: string): Promise<AuthSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    return session ? this.mapPrismaSessionToEntity(session) : null;
  }

  async findSessionBySessionId(sessionId: string): Promise<AuthSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { sessionId },
    });

    return session ? this.mapPrismaSessionToEntity(session) : null;
  }

  async findSessionByRefreshToken(
    refreshToken: string,
  ): Promise<AuthSession | null> {
    // Note: refreshToken not in schema - would need alternative storage (Redis/separate table)
    // For now, return null as we can't query by refreshToken
    console.log(
      `Finding session by refresh token: ${refreshToken} - not implemented due to schema limitations`,
    );
    return null;
  }

  async findUserSessions(userId: string): Promise<AuthSession[]> {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => this.mapPrismaSessionToEntity(session));
  }

  async findActiveUserSessions(userId: string): Promise<AuthSession[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => this.mapPrismaSessionToEntity(session));
  }

  async updateSession(
    id: string,
    sessionData: AuthSessionUpdateData,
  ): Promise<AuthSession> {
    const session = await this.prisma.session.update({
      where: { id },
      data: {
        isRevoked: sessionData.isRevoked,
        // Note: revokedAt not in schema
      },
    });

    return this.mapPrismaSessionToEntity(session);
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { sessionId },
      data: {
        isRevoked: true,
        // Note: revokedAt not in schema
      },
    });
  }

  async revokeUserSessions(
    userId: string,
    sessionIds: string[],
  ): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        sessionId: { in: sessionIds },
      },
      data: {
        isRevoked: true,
        // Note: revokedAt not in schema
      },
    });

    return result.count;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        // Note: revokedAt not in schema
      },
    });

    return result.count;
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });

    return result.count;
  }

  async deleteUserSessions(
    userId: string,
    sessionIds: string[],
  ): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        userId,
        sessionId: { in: sessionIds },
      },
    });

    return result.count;
  }

  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { sessionId },
      select: {
        isRevoked: true,
        expiresAt: true,
      },
    });

    if (!session) return false;
    if (session.isRevoked) return false;
    if (session.expiresAt < new Date()) return false;

    return true;
  }

  async isRefreshTokenValid(refreshToken: string): Promise<boolean> {
    // Note: refreshToken not in schema - would need alternative storage
    // For now, always return false as we can't validate refresh tokens
    console.log(
      `Validating refresh token: ${refreshToken} - not implemented due to schema limitations`,
    );
    return false;
  }

  private mapPrismaSessionToEntity(
    session: any,
    refreshToken?: string,
  ): AuthSession {
    return {
      id: session.id,
      sessionId: session.sessionId,
      userId: session.userId,
      refreshToken: refreshToken || '', // Use provided refreshToken or empty string
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      isRevoked: session.isRevoked,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      revokedAt: session.isRevoked ? session.createdAt : undefined, // Fallback for revokedAt
    };
  }
}
