import { AuthSession, AuthSessionCreationData, AuthSessionUpdateData } from '../entities';

export interface ISessionRepository {
  // Session creation
  createSession(sessionData: AuthSessionCreationData): Promise<AuthSession>;
  
  // Session retrieval
  findSessionById(id: string): Promise<AuthSession | null>;
  findSessionBySessionId(sessionId: string): Promise<AuthSession | null>;
  findSessionByRefreshToken(refreshToken: string): Promise<AuthSession | null>;
  findUserSessions(userId: string): Promise<AuthSession[]>;
  findActiveUserSessions(userId: string): Promise<AuthSession[]>;
  
  // Session updates
  updateSession(id: string, sessionData: AuthSessionUpdateData): Promise<AuthSession>;
  revokeSession(sessionId: string): Promise<void>;
  revokeUserSessions(userId: string, sessionIds: string[]): Promise<number>;
  revokeAllUserSessions(userId: string): Promise<number>;
  
  // Session cleanup
  deleteExpiredSessions(): Promise<number>;
  deleteUserSessions(userId: string, sessionIds: string[]): Promise<number>;
  
  // Session validation
  isSessionValid(sessionId: string): Promise<boolean>;
  isRefreshTokenValid(refreshToken: string): Promise<boolean>;
}