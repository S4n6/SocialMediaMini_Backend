import { JwtTokenGenerator } from './jwt-token-generator';
import { JwtService } from '@nestjs/jwt';
import { Token } from '../../domain/value-objects/token.vo';

describe('JwtTokenGenerator', () => {
  let tokenGenerator: JwtTokenGenerator;
  let mockJwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as any;

    tokenGenerator = new JwtTokenGenerator(mockJwtService);
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with correct payload', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'user@example.com';
      const role = 'user';
      const mockTokenString = 'mock.access.token';

      mockJwtService.sign.mockReturnValue(mockTokenString);

      // Act
      const result = await tokenGenerator.generateAccessToken(
        userId,
        email,
        role,
      );

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: userId,
          email,
          role,
          type: 'access',
        },
        { expiresIn: '15m' },
      );
      expect(result).toBeInstanceOf(Token);
      expect(result.value).toBe(mockTokenString);
    });

    it('should set expiry to 15 minutes from now', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'user@example.com';
      const role = 'user';
      const now = Date.now();

      mockJwtService.sign.mockReturnValue('mock.token.string');

      // Act
      const result = await tokenGenerator.generateAccessToken(
        userId,
        email,
        role,
      );

      // Assert
      const expectedExpiry = now + 15 * 60 * 1000;
      const actualExpiry = result.expiresAt?.getTime() || 0;
      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it('should handle different user roles', async () => {
      // Arrange
      const roles = ['user', 'admin', 'moderator'];
      mockJwtService.sign.mockReturnValue('mock.token.string');

      for (const role of roles) {
        // Act
        await tokenGenerator.generateAccessToken(
          'user-id',
          'email@test.com',
          role,
        );

        // Assert
        expect(mockJwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({ role }),
          expect.any(Object),
        );
      }
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with correct payload', async () => {
      // Arrange
      const sessionId = 'session-456';
      const userId = 'user-123';
      const mockTokenString = 'mock.refresh.token';

      mockJwtService.sign.mockReturnValue(mockTokenString);

      // Act
      const result = await tokenGenerator.generateRefreshToken(
        sessionId,
        userId,
      );

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: userId,
          sessionId,
          type: 'refresh',
        },
        { expiresIn: '7d' },
      );
      expect(result).toBeInstanceOf(Token);
      expect(result.value).toBe(mockTokenString);
    });

    it('should set expiry to 7 days from now', async () => {
      // Arrange
      const sessionId = 'session-123';
      const userId = 'user-123';
      const now = Date.now();

      mockJwtService.sign.mockReturnValue('mock.token.string');

      // Act
      const result = await tokenGenerator.generateRefreshToken(
        sessionId,
        userId,
      );

      // Assert
      const expectedExpiry = now + 7 * 24 * 60 * 60 * 1000;
      const actualExpiry = result.expiresAt?.getTime() || 0;
      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + 1000);
    });

    it('should include sessionId in token payload', async () => {
      // Arrange
      const sessionId = 'unique-session-id';
      mockJwtService.sign.mockReturnValue('mock.token.string');

      // Act
      await tokenGenerator.generateRefreshToken(sessionId, 'user-id');

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId }),
        expect.any(Object),
      );
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a verification token with correct payload', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'user@example.com';
      const mockTokenString = 'mock.verification.token';

      mockJwtService.sign.mockReturnValue(mockTokenString);

      // Act
      const result = await tokenGenerator.generateVerificationToken(
        userId,
        email,
      );

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: userId,
          email,
          type: 'verification',
        },
        { expiresIn: '24h' },
      );
      expect(result).toBeInstanceOf(Token);
      expect(result.value).toBe(mockTokenString);
    });

    it('should set expiry to 24 hours from now', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'user@example.com';
      const now = Date.now();

      mockJwtService.sign.mockReturnValue('mock.token.string');

      // Act
      const result = await tokenGenerator.generateVerificationToken(
        userId,
        email,
      );

      // Assert
      const expectedExpiry = now + 24 * 60 * 60 * 1000;
      const actualExpiry = result.expiresAt?.getTime() || 0;
      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a password reset token with correct payload', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'user@example.com';
      const mockTokenString = 'mock.reset.token';

      mockJwtService.sign.mockReturnValue(mockTokenString);

      // Act
      const result = await tokenGenerator.generatePasswordResetToken(
        userId,
        email,
      );

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          sub: userId,
          email,
          type: 'password-reset',
        },
        { expiresIn: '1h' },
      );
      expect(result).toBeInstanceOf(Token);
      expect(result.value).toBe(mockTokenString);
    });

    it('should set expiry to 1 hour from now', async () => {
      // Arrange
      const userId = 'user-123';
      const email = 'user@example.com';
      const now = Date.now();

      mockJwtService.sign.mockReturnValue('mock.token.string');

      // Act
      const result = await tokenGenerator.generatePasswordResetToken(
        userId,
        email,
      );

      // Assert
      const expectedExpiry = now + 60 * 60 * 1000;
      const actualExpiry = result.expiresAt?.getTime() || 0;
      expect(actualExpiry).toBeGreaterThanOrEqual(expectedExpiry - 1000);
      expect(actualExpiry).toBeLessThanOrEqual(expectedExpiry + 1000);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', async () => {
      // Arrange
      const tokenString = 'valid.access.token';
      const token = new Token(tokenString);
      const mockPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        role: 'user',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      // Act
      const result = await tokenGenerator.verifyAccessToken(token);

      // Assert
      expect(mockJwtService.verify).toHaveBeenCalledWith(tokenString);
      expect(result).toEqual({
        userId: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
        iat: mockPayload.iat,
        exp: mockPayload.exp,
      });
    });

    it('should throw error for invalid token type', async () => {
      // Arrange
      const token = new Token('invalid.token');
      const mockPayload = {
        sub: 'user-123',
        type: 'refresh', // Wrong type
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      // Act & Assert
      await expect(tokenGenerator.verifyAccessToken(token)).rejects.toThrow(
        'Invalid access token',
      );
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const token = new Token('expired.token');
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act & Assert
      await expect(tokenGenerator.verifyAccessToken(token)).rejects.toThrow(
        'Invalid access token',
      );
    });

    it('should throw error for malformed token', async () => {
      // Arrange
      const token = new Token('malformed.token');
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(tokenGenerator.verifyAccessToken(token)).rejects.toThrow(
        'Invalid access token',
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', async () => {
      // Arrange
      const tokenString = 'valid.refresh.token';
      const token = new Token(tokenString);
      const mockPayload = {
        sub: 'user-123',
        sessionId: 'session-456',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      // Act
      const result = await tokenGenerator.verifyRefreshToken(token);

      // Assert
      expect(mockJwtService.verify).toHaveBeenCalledWith(tokenString);
      expect(result).toEqual({
        sessionId: mockPayload.sessionId,
        userId: mockPayload.sub,
        iat: mockPayload.iat,
        exp: mockPayload.exp,
      });
    });

    it('should throw error for wrong token type', async () => {
      // Arrange
      const token = new Token('wrong.type.token');
      const mockPayload = {
        sub: 'user-123',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      // Act & Assert
      await expect(tokenGenerator.verifyRefreshToken(token)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('verifyVerificationToken', () => {
    it('should verify a valid verification token', async () => {
      // Arrange
      const tokenString = 'valid.verification.token';
      const token = new Token(tokenString);
      const mockPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        type: 'verification',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      // Act
      const result = await tokenGenerator.verifyVerificationToken(token);

      // Assert
      expect(result).toEqual({
        userId: mockPayload.sub,
        email: mockPayload.email,
        iat: mockPayload.iat,
        exp: mockPayload.exp,
      });
    });

    it('should throw error for invalid verification token', async () => {
      // Arrange
      const token = new Token('invalid.token');
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(
        tokenGenerator.verifyVerificationToken(token),
      ).rejects.toThrow('Invalid verification token');
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify a valid password reset token', async () => {
      // Arrange
      const tokenString = 'valid.reset.token';
      const token = new Token(tokenString);
      const mockPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        type: 'password-reset',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      // Act
      const result = await tokenGenerator.verifyPasswordResetToken(token);

      // Assert
      expect(result).toEqual({
        userId: mockPayload.sub,
        email: mockPayload.email,
        iat: mockPayload.iat,
        exp: mockPayload.exp,
      });
    });

    it('should throw error for wrong token type', async () => {
      // Arrange
      const token = new Token('wrong.token');
      const mockPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockJwtService.verify.mockReturnValue(mockPayload);

      // Act & Assert
      await expect(
        tokenGenerator.verifyPasswordResetToken(token),
      ).rejects.toThrow('Invalid password reset token');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      const token = new Token('valid.token', futureDate);

      // Act
      const result = tokenGenerator.isTokenExpired(token);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      // Arrange
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      const token = new Token('expired.token', pastDate);

      // Act
      const result = tokenGenerator.isTokenExpired(token);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for token expiring exactly now', () => {
      // Arrange
      const pastMoment = new Date(Date.now() - 1);
      const token = new Token('expiring.token', pastMoment);

      // Act
      const result = tokenGenerator.isTokenExpired(token);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('Token type safety', () => {
    it('should only accept correct token types for each verify method', async () => {
      // Arrange
      const accessPayload = {
        sub: 'user',
        type: 'access',
        email: 'e@e.com',
        role: 'user',
        iat: 1,
        exp: 2,
      };
      const refreshPayload = {
        sub: 'user',
        type: 'refresh',
        sessionId: 's',
        iat: 1,
        exp: 2,
      };
      const verificationPayload = {
        sub: 'user',
        type: 'verification',
        email: 'e@e.com',
        iat: 1,
        exp: 2,
      };
      const resetPayload = {
        sub: 'user',
        type: 'password-reset',
        email: 'e@e.com',
        iat: 1,
        exp: 2,
      };

      // Test access token verification rejects other types
      mockJwtService.verify.mockReturnValue(refreshPayload);
      await expect(
        tokenGenerator.verifyAccessToken(new Token('valid.token.string')),
      ).rejects.toThrow();

      // Test refresh token verification rejects other types
      mockJwtService.verify.mockReturnValue(accessPayload);
      await expect(
        tokenGenerator.verifyRefreshToken(new Token('valid.token.string')),
      ).rejects.toThrow();

      // Test verification token verification rejects other types
      mockJwtService.verify.mockReturnValue(resetPayload);
      await expect(
        tokenGenerator.verifyVerificationToken(new Token('valid.token.string')),
      ).rejects.toThrow();

      // Test reset token verification rejects other types
      mockJwtService.verify.mockReturnValue(verificationPayload);
      await expect(
        tokenGenerator.verifyPasswordResetToken(
          new Token('valid.token.string'),
        ),
      ).rejects.toThrow();
    });
  });

  describe('Token expiry durations', () => {
    it('should use different expiry durations for different token types', async () => {
      // Arrange
      mockJwtService.sign.mockReturnValue('valid.token.string');

      // Act
      await tokenGenerator.generateAccessToken(
        'user',
        'email@test.com',
        'user',
      );
      await tokenGenerator.generateRefreshToken('session', 'user');
      await tokenGenerator.generateVerificationToken('user', 'email@test.com');
      await tokenGenerator.generatePasswordResetToken('user', 'email@test.com');

      // Assert
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        { expiresIn: '15m' },
      );
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        { expiresIn: '7d' },
      );
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        3,
        expect.anything(),
        { expiresIn: '24h' },
      );
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        4,
        expect.anything(),
        { expiresIn: '1h' },
      );
    });
  });
});
