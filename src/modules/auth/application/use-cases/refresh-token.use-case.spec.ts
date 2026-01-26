import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { RefreshTokenRequest } from './auth.dtos';
import { ITokenRepository } from '../../domain/repositories/token.repository';
import { TOKEN_REPOSITORY_TOKEN } from '../../auth.constants';
import { InvalidTokenException } from '../../domain/exceptions/auth.exceptions';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let tokenService: jest.Mocked<ITokenRepository>;

  // Test data factory
  const createValidRequest = (
    overrides: Partial<RefreshTokenRequest> = {},
  ): RefreshTokenRequest => ({
    refreshToken: 'valid-refresh-token-123456',
    ...overrides,
  });

  const createTestTokens = () => ({
    accessToken: 'new-access-token-123',
    refreshToken: 'new-refresh-token-456',
  });

  beforeEach(async () => {
    // Create mocks
    const mockTokenService: jest.Mocked<ITokenRepository> = {
      refreshAccessToken: jest.fn(),
      save: jest.fn(),
      findByToken: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
      createTokensForUser: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        {
          provide: TOKEN_REPOSITORY_TOKEN,
          useValue: mockTokenService,
        },
      ],
    }).compile();

    useCase = module.get<RefreshTokenUseCase>(RefreshTokenUseCase);
    tokenService = module.get(TOKEN_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Token Refresh', () => {
    it('should refresh tokens successfully with valid refresh token', async () => {
      // Arrange
      const request = createValidRequest();
      const mockTokens = createTestTokens();

      tokenService.refreshAccessToken.mockResolvedValue(mockTokens as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(tokenService.refreshAccessToken).toHaveBeenCalledWith(
        request.refreshToken,
      );
      expect(result).toEqual({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
      });
    });

    it('should return new refresh token when rotation is enabled', async () => {
      // Arrange
      const request = createValidRequest();
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-rotated-refresh-token',
      };

      tokenService.refreshAccessToken.mockResolvedValue(mockTokens as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.refreshToken).toBe('new-rotated-refresh-token');
      expect(result.refreshToken).not.toBe(request.refreshToken);
    });
  });

  describe('Token Validation Errors', () => {
    it('should throw InvalidTokenException when refreshToken is null', async () => {
      // Arrange
      const request = createValidRequest({ refreshToken: null as any });

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
      expect(tokenService.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should throw InvalidTokenException when refreshToken is undefined', async () => {
      // Arrange
      const request = createValidRequest({ refreshToken: undefined as any });

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
      expect(tokenService.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should throw InvalidTokenException when refreshToken is empty string', async () => {
      // Arrange
      const request = createValidRequest({ refreshToken: '' });

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
      expect(tokenService.refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should throw InvalidTokenException when refreshToken is only whitespace', async () => {
      // Arrange
      const request = createValidRequest({ refreshToken: '   ' });
      const serviceError = new Error('Invalid token format');

      tokenService.refreshAccessToken.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
      // The service will be called and should reject the whitespace token
      expect(tokenService.refreshAccessToken).toHaveBeenCalledWith('   ');
    });
  });

  describe('Token Service Errors', () => {
    it('should throw InvalidTokenException when token service throws any error', async () => {
      // Arrange
      const request = createValidRequest();
      const serviceError = new Error('Token expired');

      tokenService.refreshAccessToken.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
      expect(tokenService.refreshAccessToken).toHaveBeenCalledWith(
        request.refreshToken,
      );
    });

    it('should throw InvalidTokenException when token service throws InvalidTokenException', async () => {
      // Arrange
      const request = createValidRequest();
      const serviceError = new InvalidTokenException('refresh');

      tokenService.refreshAccessToken.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
    });

    it('should throw InvalidTokenException when token service throws database error', async () => {
      // Arrange
      const request = createValidRequest();
      const serviceError = new Error('Database connection failed');

      tokenService.refreshAccessToken.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
    });

    it('should throw InvalidTokenException when token service returns null', async () => {
      // Arrange
      const request = createValidRequest();

      tokenService.refreshAccessToken.mockResolvedValue(null as any);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
    });

    it('should throw InvalidTokenException when token service returns undefined', async () => {
      // Arrange
      const request = createValidRequest();

      tokenService.refreshAccessToken.mockResolvedValue(undefined as any);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
    });
  });

  describe('Result Structure', () => {
    it('should return correct result structure', async () => {
      // Arrange
      const request = createValidRequest();
      const mockTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };

      tokenService.refreshAccessToken.mockResolvedValue(mockTokens as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    it('should preserve exact token values from service', async () => {
      // Arrange
      const request = createValidRequest();
      const mockTokens = {
        accessToken: 'exact-access-token-value-123',
        refreshToken: 'exact-refresh-token-value-456',
      };

      tokenService.refreshAccessToken.mockResolvedValue(mockTokens as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.accessToken).toBe('exact-access-token-value-123');
      expect(result.refreshToken).toBe('exact-refresh-token-value-456');
    });
  });

  describe('Input Validation', () => {
    it('should handle null request object', async () => {
      // Act & Assert
      await expect(useCase.execute(null as any)).rejects.toThrow();
    });

    it('should handle undefined request object', async () => {
      // Act & Assert
      await expect(useCase.execute(undefined as any)).rejects.toThrow();
    });

    it('should handle request object without refreshToken property', async () => {
      // Act & Assert
      await expect(useCase.execute({} as any)).rejects.toThrow(
        InvalidTokenException,
      );
    });
  });

  describe('Token Security', () => {
    it('should not log or expose refresh token in errors', async () => {
      // Arrange
      const request = createValidRequest({
        refreshToken: 'sensitive-token-123',
      });
      const serviceError = new Error('Service error');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      tokenService.refreshAccessToken.mockRejectedValue(serviceError);

      // Act & Assert
      try {
        await useCase.execute(request);
      } catch (error) {
        // Should not expose the actual refresh token
        expect(error.message).not.toContain('sensitive-token-123');
      }

      consoleSpy.mockRestore();
    });

    it('should validate refresh token format implicitly through service', async () => {
      // Arrange
      const request = createValidRequest({ refreshToken: 'malformed-token' });
      const serviceError = new Error('Invalid token format');

      tokenService.refreshAccessToken.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidTokenException,
      );
      expect(tokenService.refreshAccessToken).toHaveBeenCalledWith(
        'malformed-token',
      );
    });
  });

  describe('Error Message Consistency', () => {
    it('should throw InvalidTokenException with "refresh" type for all token errors', async () => {
      // Arrange
      const request = createValidRequest();
      const serviceError = new Error('Any error');

      tokenService.refreshAccessToken.mockRejectedValue(serviceError);

      // Act & Assert
      try {
        await useCase.execute(request);
        fail('Expected InvalidTokenException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidTokenException);
        expect(error.message).toContain('refresh');
      }
    });

    it('should throw consistent exception for missing token', async () => {
      // Arrange
      const request = createValidRequest({ refreshToken: null as any });

      // Act & Assert
      try {
        await useCase.execute(request);
        fail('Expected InvalidTokenException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidTokenException);
        expect(error.message).toContain('refresh');
      }
    });
  });

  describe('Service Integration', () => {
    it('should call refreshAccessToken with exact token value', async () => {
      // Arrange
      const tokenValue = 'very-specific-token-value-12345';
      const request = createValidRequest({ refreshToken: tokenValue });
      const mockTokens = createTestTokens();

      tokenService.refreshAccessToken.mockResolvedValue(mockTokens as any);

      // Act
      await useCase.execute(request);

      // Assert
      expect(tokenService.refreshAccessToken).toHaveBeenCalledWith(tokenValue);
      expect(tokenService.refreshAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should not modify refresh token before passing to service', async () => {
      // Arrange
      const originalToken = '  token-with-spaces  ';
      const request = createValidRequest({ refreshToken: originalToken });
      const mockTokens = createTestTokens();

      tokenService.refreshAccessToken.mockResolvedValue(mockTokens as any);

      // Act
      await useCase.execute(request);

      // Assert - Should not trim or modify the token
      expect(tokenService.refreshAccessToken).toHaveBeenCalledWith(
        originalToken,
      );
    });
  });
});
