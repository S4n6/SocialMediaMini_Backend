import { AuthSession } from '../entities/session.entity';

/**
 * Session Repository Interface - Domain Layer
 * Pure domain contract for session persistence operations
 */
export interface ISessionRepository {
  /**
   * Create new session
   */
  create(session: AuthSession): Promise<AuthSession>;

  /**
   * Find session by ID (database ID)
   */
  findById(sessionId: string): Promise<AuthSession | null>;

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
   * Check if session exists and is valid
   */
  isValidSession(sessionId: string): Promise<boolean>;

  /**
   * Delete sessions by userId and sessionIds array
   */
  deleteSessions(userId: string, sessionIds: string[]): Promise<void>;

  /**
   * Delete sessions by user agent
   */
  deleteSessionsByUserAgent(userId: string, userAgent: string): Promise<void>;

  /**
   * Get session info from refresh token (for compatibility)
   */
  getSessionFromRefreshToken(
    refreshToken: string,
  ): Promise<{ sessionId: string } | null>;

  /**
   * Find session by refresh token
   */
  findByRefreshToken(refreshToken: string): Promise<AuthSession | null>;
}
