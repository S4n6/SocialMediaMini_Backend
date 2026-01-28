import { AuthSession } from './session.entity';
import { Token } from '../value-objects/token.vo';

describe('AuthSession Entity', () => {
  // Test data factory
  const createValidSessionProps = (overrides: any = {}) => ({
    id: 'session-123',
    userId: 'user-456',
    refreshToken: new Token('valid-refresh-token-1234567890'),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    ...overrides,
  });

  const createValidPersistenceProps = (overrides: any = {}) => ({
    id: 'session-123',
    sessionId: 'generated-session-id-hash',
    userId: 'user-456',
    refreshToken: new Token('valid-refresh-token-1234567890'),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    isRevoked: false,
    createdAt: new Date('2026-01-01'),
    expiresAt: new Date('2026-01-08'),
    revokedAt: null,
    ...overrides,
  });

  describe('AuthSession Creation - Static Factory Methods', () => {
    describe('AuthSession.create()', () => {
      it('should create new session with required properties', () => {
        const props = createValidSessionProps();
        const session = AuthSession.create(props);

        expect(session.id).toBe(props.id);
        expect(session.userId).toBe(props.userId);
        expect(session.refreshToken).toBe(props.refreshToken);
        expect(session.ipAddress).toBe(props.ipAddress);
        expect(session.userAgent).toBe(props.userAgent);
        expect(session.expiresAt).toBe(props.expiresAt);
        expect(session.isRevoked).toBe(false);
        expect(session.revokedAt).toBeNull();
        expect(session.createdAt).toBeInstanceOf(Date);
      });

      it('should generate sessionId from refresh token hash when not provided', () => {
        const props = createValidSessionProps();
        const session = AuthSession.create(props);

        expect(session.sessionId).toBeDefined();
        expect(session.sessionId).toHaveLength(64); // SHA256 hash length
        expect(typeof session.sessionId).toBe('string');
      });

      it('should use provided sessionId when specified', () => {
        const customSessionId = 'custom-session-id-12345';
        const props = createValidSessionProps({
          sessionId: customSessionId,
        });
        const session = AuthSession.create(props);

        expect(session.sessionId).toBe(customSessionId);
      });

      it('should handle null optional properties', () => {
        const props = createValidSessionProps({
          ipAddress: undefined,
          userAgent: undefined,
        });
        const session = AuthSession.create(props);

        expect(session.ipAddress).toBeNull();
        expect(session.userAgent).toBeNull();
      });

      it('should set creation timestamp', () => {
        const before = new Date();
        const session = AuthSession.create(createValidSessionProps());
        const after = new Date();

        expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(session.createdAt.getTime()).toBeLessThanOrEqual(
          after.getTime(),
        );
      });
    });

    describe('AuthSession.fromPersistence()', () => {
      it('should reconstruct session from persistence data', () => {
        const props = createValidPersistenceProps();
        const session = AuthSession.fromPersistence(props);

        expect(session.id).toBe(props.id);
        expect(session.sessionId).toBe(props.sessionId);
        expect(session.userId).toBe(props.userId);
        expect(session.refreshToken).toBe(props.refreshToken);
        expect(session.ipAddress).toBe(props.ipAddress);
        expect(session.userAgent).toBe(props.userAgent);
        expect(session.isRevoked).toBe(props.isRevoked);
        expect(session.createdAt).toBe(props.createdAt);
        expect(session.expiresAt).toBe(props.expiresAt);
        expect(session.revokedAt).toBe(props.revokedAt);
      });

      it('should reconstruct revoked session', () => {
        const revokedAt = new Date('2026-01-05');
        const props = createValidPersistenceProps({
          isRevoked: true,
          revokedAt,
        });
        const session = AuthSession.fromPersistence(props);

        expect(session.isRevoked).toBe(true);
        expect(session.revokedAt).toBe(revokedAt);
      });
    });

    describe('AuthSession.generateSessionId()', () => {
      it('should generate consistent sessionId for same refresh token', () => {
        const refreshToken = 'test-refresh-token-123';
        const sessionId1 = AuthSession.generateSessionId(refreshToken);
        const sessionId2 = AuthSession.generateSessionId(refreshToken);

        expect(sessionId1).toBe(sessionId2);
        expect(sessionId1).toHaveLength(64); // SHA256 hash length
      });

      it('should generate different sessionIds for different tokens', () => {
        const token1 = 'refresh-token-1';
        const token2 = 'refresh-token-2';

        const sessionId1 = AuthSession.generateSessionId(token1);
        const sessionId2 = AuthSession.generateSessionId(token2);

        expect(sessionId1).not.toBe(sessionId2);
      });
    });
  });

  describe('Session Business Logic - Token Validation', () => {
    describe('isValidRefreshToken()', () => {
      it('should return true for matching refresh token', () => {
        const refreshToken = 'test-refresh-token-1234567890';
        const props = createValidSessionProps({
          refreshToken: new Token(refreshToken),
        });
        const session = AuthSession.create(props);

        expect(session.isValidRefreshToken(refreshToken)).toBe(true);
      });

      it('should return false for non-matching refresh token', () => {
        const refreshToken = 'test-refresh-token-1234567890';
        const wrongToken = 'different-refresh-token-0987654321';
        const props = createValidSessionProps({
          refreshToken: new Token(refreshToken),
        });
        const session = AuthSession.create(props);

        expect(session.isValidRefreshToken(wrongToken)).toBe(false);
      });

      it('should handle empty token string', () => {
        const props = createValidSessionProps();
        const session = AuthSession.create(props);

        expect(session.isValidRefreshToken('')).toBe(false);
      });
    });
  });

  describe('Session Business Logic - Revocation', () => {
    describe('revoke()', () => {
      it('should revoke active session', () => {
        const originalSession = AuthSession.create(createValidSessionProps());
        expect(originalSession.isRevoked).toBe(false);

        const before = new Date();
        const revokedSession = originalSession.revoke();
        const after = new Date();

        expect(revokedSession.isRevoked).toBe(true);
        expect(revokedSession.revokedAt).toBeInstanceOf(Date);
        expect(revokedSession.revokedAt!.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(revokedSession.revokedAt!.getTime()).toBeLessThanOrEqual(
          after.getTime(),
        );

        // Original should be unchanged (immutability)
        expect(originalSession.isRevoked).toBe(false);
        expect(originalSession.revokedAt).toBeNull();
      });

      it('should throw error when session is already revoked', () => {
        const revokedSession = AuthSession.fromPersistence(
          createValidPersistenceProps({
            isRevoked: true,
            revokedAt: new Date(),
          }),
        );

        expect(() => revokedSession.revoke()).toThrow(
          'Session is already revoked',
        );
      });

      it('should maintain other properties when revoking', () => {
        const originalSession = AuthSession.create(createValidSessionProps());
        const revokedSession = originalSession.revoke();

        expect(revokedSession.id).toBe(originalSession.id);
        expect(revokedSession.sessionId).toBe(originalSession.sessionId);
        expect(revokedSession.userId).toBe(originalSession.userId);
        expect(revokedSession.refreshToken).toBe(originalSession.refreshToken);
        expect(revokedSession.ipAddress).toBe(originalSession.ipAddress);
        expect(revokedSession.userAgent).toBe(originalSession.userAgent);
        expect(revokedSession.createdAt).toBe(originalSession.createdAt);
        expect(revokedSession.expiresAt).toBe(originalSession.expiresAt);
      });
    });
  });

  describe('Session Business Logic - Extension', () => {
    describe('extend()', () => {
      it('should extend active session with later expiry date', () => {
        const currentExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        const newExpiry = new Date(Date.now() + 7200000); // 2 hours from now
        const originalSession = AuthSession.create(
          createValidSessionProps({
            expiresAt: currentExpiry,
          }),
        );

        const extendedSession = originalSession.extend(newExpiry);

        expect(extendedSession.expiresAt).toBe(newExpiry);
        expect(extendedSession.expiresAt.getTime()).toBeGreaterThan(
          originalSession.expiresAt.getTime(),
        );

        // Original should be unchanged (immutability)
        expect(originalSession.expiresAt).toBe(currentExpiry);
      });

      it('should throw error when trying to extend revoked session', () => {
        const revokedSession = AuthSession.fromPersistence(
          createValidPersistenceProps({
            isRevoked: true,
            revokedAt: new Date(),
          }),
        );

        const newExpiry = new Date(Date.now() + 3600000);
        expect(() => revokedSession.extend(newExpiry)).toThrow(
          'Cannot extend a revoked session',
        );
      });

      it('should throw error when trying to extend expired session', () => {
        const pastCreation = new Date(Date.now() - 7200000); // 2 hours ago
        const pastExpiry = new Date(Date.now() - 3600000); // 1 hour ago
        const expiredSession = AuthSession.fromPersistence(
          createValidPersistenceProps({
            createdAt: pastCreation,
            expiresAt: pastExpiry,
          }),
        );

        const newExpiry = new Date(Date.now() + 3600000);
        expect(() => expiredSession.extend(newExpiry)).toThrow(
          'Cannot extend an expired session',
        );
      });

      it('should throw error when new expiry is not later', () => {
        const currentExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        const earlierExpiry = new Date(Date.now() + 1800000); // 30 minutes from now
        const session = AuthSession.create(
          createValidSessionProps({
            expiresAt: currentExpiry,
          }),
        );

        expect(() => session.extend(earlierExpiry)).toThrow(
          'New expiry date must be later than current expiry date',
        );
      });

      it('should throw error when new expiry is same as current', () => {
        const currentExpiry = new Date(Date.now() + 3600000);
        const sameExpiry = new Date(currentExpiry.getTime());
        const session = AuthSession.create(
          createValidSessionProps({
            expiresAt: currentExpiry,
          }),
        );

        expect(() => session.extend(sameExpiry)).toThrow(
          'New expiry date must be later than current expiry date',
        );
      });

      it('should maintain other properties when extending', () => {
        const originalSession = AuthSession.create(
          createValidSessionProps({
            expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
          }),
        );
        const newExpiry = new Date(Date.now() + 7200000); // 2 hours from now
        const extendedSession = originalSession.extend(newExpiry);

        expect(extendedSession.id).toBe(originalSession.id);
        expect(extendedSession.sessionId).toBe(originalSession.sessionId);
        expect(extendedSession.userId).toBe(originalSession.userId);
        expect(extendedSession.refreshToken).toBe(originalSession.refreshToken);
        expect(extendedSession.ipAddress).toBe(originalSession.ipAddress);
        expect(extendedSession.userAgent).toBe(originalSession.userAgent);
        expect(extendedSession.isRevoked).toBe(originalSession.isRevoked);
        expect(extendedSession.createdAt).toBe(originalSession.createdAt);
        expect(extendedSession.revokedAt).toBe(originalSession.revokedAt);
      });
    });
  });

  describe('Session Status Checks', () => {
    describe('isExpired()', () => {
      it('should return false for future expiry', () => {
        const futureExpiry = new Date(Date.now() + 3600000); // 1 hour from now
        const session = AuthSession.create(
          createValidSessionProps({
            expiresAt: futureExpiry,
          }),
        );

        expect(session.isExpired()).toBe(false);
      });

      it('should return true for past expiry', () => {
        const pastCreation = new Date(Date.now() - 7200000); // 2 hours ago
        const pastExpiry = new Date(Date.now() - 3600000); // 1 hour ago
        const session = AuthSession.fromPersistence(
          createValidPersistenceProps({
            createdAt: pastCreation,
            expiresAt: pastExpiry,
          }),
        );

        expect(session.isExpired()).toBe(true);
      });

      it('should return true for current time expiry', () => {
        const pastCreation = new Date(Date.now() - 3600000); // 1 hour ago
        const almostNow = new Date(Date.now() - 100); // 100ms ago to ensure it's expired
        const session = AuthSession.fromPersistence(
          createValidPersistenceProps({
            createdAt: pastCreation,
            expiresAt: almostNow,
          }),
        );

        // Should be expired
        expect(session.isExpired()).toBe(true);
      });
    });

    describe('isValid()', () => {
      it('should return true for active, non-expired session', () => {
        const futureExpiry = new Date(Date.now() + 3600000);
        const session = AuthSession.create(
          createValidSessionProps({
            expiresAt: futureExpiry,
          }),
        );

        expect(session.isValid()).toBe(true);
      });

      it('should return false for revoked session', () => {
        const futureExpiry = new Date(Date.now() + 3600000);
        const revokedSession = AuthSession.fromPersistence(
          createValidPersistenceProps({
            expiresAt: futureExpiry,
            isRevoked: true,
            revokedAt: new Date(),
          }),
        );

        expect(revokedSession.isValid()).toBe(false);
      });

      it('should return false for expired session', () => {
        const pastCreation = new Date(Date.now() - 7200000); // 2 hours ago
        const pastExpiry = new Date(Date.now() - 3600000); // 1 hour ago
        const session = AuthSession.fromPersistence(
          createValidPersistenceProps({
            createdAt: pastCreation,
            expiresAt: pastExpiry,
          }),
        );

        expect(session.isValid()).toBe(false);
      });

      it('should return false for expired and revoked session', () => {
        const pastExpiry = new Date(Date.now() - 3600000);
        const session = AuthSession.fromPersistence(
          createValidPersistenceProps({
            expiresAt: pastExpiry,
            isRevoked: true,
            revokedAt: new Date(),
          }),
        );

        expect(session.isValid()).toBe(false);
      });
    });
  });

  describe('Session Utility Methods', () => {
    describe('getDurationInMinutes()', () => {
      it('should calculate session duration correctly', () => {
        const createdAt = new Date('2026-01-01T00:00:00Z');
        const expiresAt = new Date('2026-01-01T02:30:00Z'); // 2.5 hours later
        const session = AuthSession.fromPersistence(
          createValidPersistenceProps({
            createdAt,
            expiresAt,
          }),
        );

        expect(session.getDurationInMinutes()).toBe(150); // 2.5 hours = 150 minutes
      });

      it('should handle short duration sessions', () => {
        const createdAt = new Date('2026-01-01T00:00:00Z');
        const expiresAt = new Date('2026-01-01T00:15:00Z'); // 15 minutes later
        const session = AuthSession.fromPersistence(
          createValidPersistenceProps({
            createdAt,
            expiresAt,
          }),
        );

        expect(session.getDurationInMinutes()).toBe(15);
      });
    });

    describe('getTimeRemainingInMinutes()', () => {
      it('should return remaining time for active session', () => {
        const futureExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
        const session = AuthSession.create(
          createValidSessionProps({
            expiresAt: futureExpiry,
          }),
        );

        const remaining = session.getTimeRemainingInMinutes();
        expect(remaining).toBeGreaterThanOrEqual(29); // Allow for small timing differences
        expect(remaining).toBeLessThanOrEqual(30);
      });

      it('should return 0 for expired session', () => {
        const pastCreation = new Date(Date.now() - 7200000); // 2 hours ago
        const pastExpiry = new Date(Date.now() - 3600000); // 1 hour ago
        const session = AuthSession.fromPersistence(
          createValidPersistenceProps({
            createdAt: pastCreation,
            expiresAt: pastExpiry,
          }),
        );

        expect(session.getTimeRemainingInMinutes()).toBe(0);
      });

      it('should return 0 for session expiring now', () => {
        const pastCreation = new Date(Date.now() - 3600000); // 1 hour ago
        const now = new Date();
        const session = AuthSession.fromPersistence(
          createValidPersistenceProps({
            createdAt: pastCreation,
            expiresAt: now,
          }),
        );

        expect(session.getTimeRemainingInMinutes()).toBe(0);
      });
    });
  });

  describe('Session Validation - Invariants', () => {
    describe('Invariant Validation', () => {
      it('should throw error when session ID is missing', () => {
        expect(() =>
          AuthSession.fromPersistence(createValidPersistenceProps({ id: '' })),
        ).toThrow('Session ID is required');
      });

      it('should throw error when sessionId is missing', () => {
        expect(() =>
          AuthSession.fromPersistence(
            createValidPersistenceProps({ sessionId: '' }),
          ),
        ).toThrow('Session identifier is required');
      });

      it('should throw error when userId is missing', () => {
        expect(() =>
          AuthSession.fromPersistence(
            createValidPersistenceProps({ userId: '' }),
          ),
        ).toThrow('User ID is required');
      });

      it('should throw error when refresh token is missing', () => {
        expect(() =>
          AuthSession.fromPersistence(
            createValidPersistenceProps({ refreshToken: null }),
          ),
        ).toThrow('Refresh token is required');
      });

      it('should throw error when expiry is before creation', () => {
        const createdAt = new Date('2026-01-02');
        const expiresAt = new Date('2026-01-01'); // Before creation

        expect(() =>
          AuthSession.fromPersistence(
            createValidPersistenceProps({
              createdAt,
              expiresAt,
            }),
          ),
        ).toThrow('Expiry date must be after creation date');
      });

      it('should throw error when revoked without revokedAt', () => {
        expect(() =>
          AuthSession.fromPersistence(
            createValidPersistenceProps({
              isRevoked: true,
              revokedAt: null,
            }),
          ),
        ).toThrow('Revoked sessions must have a revoked timestamp');
      });

      it('should throw error when not revoked but has revokedAt', () => {
        expect(() =>
          AuthSession.fromPersistence(
            createValidPersistenceProps({
              isRevoked: false,
              revokedAt: new Date(),
            }),
          ),
        ).toThrow('Non-revoked sessions cannot have a revoked timestamp');
      });
    });
  });

  describe('Session Serialization', () => {
    describe('toPlainObject()', () => {
      it('should convert to plain object with all properties', () => {
        const session = AuthSession.fromPersistence(
          createValidPersistenceProps({
            isRevoked: true,
            revokedAt: new Date('2026-01-05'),
          }),
        );

        const plainObject = session.toPlainObject();

        expect(plainObject).toEqual({
          id: session.id,
          sessionId: session.sessionId,
          userId: session.userId,
          refreshToken: session.refreshToken.value, // Token VO serialized to string
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          isRevoked: session.isRevoked,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          revokedAt: session.revokedAt,
        });
      });

      it('should handle null values correctly', () => {
        const session = AuthSession.create(
          createValidSessionProps({
            ipAddress: undefined,
            userAgent: undefined,
          }),
        );
        const plainObject = session.toPlainObject();

        expect(plainObject.ipAddress).toBeNull();
        expect(plainObject.userAgent).toBeNull();
        expect(plainObject.revokedAt).toBeNull();
      });
    });
  });

  describe('Session Immutability', () => {
    it('should not modify original session when calling revoke', () => {
      const originalSession = AuthSession.create(createValidSessionProps());
      const originalRevoked = originalSession.isRevoked;
      const originalRevokedAt = originalSession.revokedAt;

      originalSession.revoke();

      expect(originalSession.isRevoked).toBe(originalRevoked);
      expect(originalSession.revokedAt).toBe(originalRevokedAt);
    });

    it('should not modify original session when calling extend', () => {
      const originalSession = AuthSession.create(createValidSessionProps());
      const originalExpiresAt = originalSession.expiresAt;

      const newExpiry = new Date(originalExpiresAt.getTime() + 3600000);
      originalSession.extend(newExpiry);

      expect(originalSession.expiresAt).toBe(originalExpiresAt);
    });
  });
});
