import { AuthSession } from '../../domain/entities/session.entity';

/**
 * Session Repository Interface - Domain Layer
 * Pure interface for session management operations
 */
export interface ISessionRepository {
  /**
   * Create new session
   */
  create(session: AuthSession): Promise<AuthSession>;
  create(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string>;

  /**
   * Find session by ID (database ID)
   */
  findById(sessionId: string): Promise<AuthSession | null>;

  /**
   * Find session by refresh token (uses hashed sessionId)
   */
  findByRefreshToken(refreshToken: string): Promise<AuthSession | null>;

  /**
   * Find session by sessionId (hashed refresh token)
   */
  findBySessionId(sessionId: string): Promise<AuthSession | null>;

  /**
   * Find all sessions by user ID
   */
  findByUserId(userId: string): Promise<AuthSession[]>;

  /**
   * Update session
   */
  update(
    sessionId: string,
    session: Partial<AuthSession>,
  ): Promise<AuthSession>;

  /**
   * Delete session
   */
  delete(sessionId: string): Promise<void>;

  /**
   * Delete all sessions for user
   */
  deleteAllByUserId(userId: string): Promise<void>;

  /**
   * Delete expired sessions
   */
  deleteExpired(): Promise<void>;

  /**
   * Check if session exists and is valid
   */
  isValidSession(sessionId: string): Promise<boolean>;

  /**
   * Extend session expiry
   */
  extendSession(sessionId: string, newExpiryDate: Date): Promise<void>;

  /**
   * Delete sessions by userId and sessionIds array
   */
  deleteSessions(userId: string, sessionIds: string[]): Promise<void>;

  /**
   * Delete sessions by user agent
   */
  deleteSessionsByUserAgent(userId: string, userAgent: string): Promise<void>;

  /**
   * Get session from refresh token
   */
  getSessionFromRefreshToken(refreshToken: string): Promise<any>;

  /**
   * Verify and update session
   */
  verifyAndUpdateSession(refreshToken: string): Promise<any>;

  /**
   * Rotate refresh token
   */
  rotateRefreshToken(sessionId: string, userId: string): Promise<string>;
}
