import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from './login.use-case';
import { LoginRequest } from './auth.dtos';
import { IUserRepository } from '../../../users/domain/repositories/user.repository';
import { ITokenRepository } from '../../domain/repositories/token.repository';
import { ISessionRepository } from '../../domain/repositories/session.repository';
import { IPasswordHasher } from '../../domain/repositories/password-hasher.repository';
import { UserApplicationService } from '../../../users/application/user-application.service';
import { SessionDomainService } from '../../domain/services/session-domain.service';
import { Password } from '../../domain/value-objects/password.vo';
import { USER_REPOSITORY_TOKEN } from '../../../users/users.constants';
import {
  TOKEN_REPOSITORY_TOKEN,
  SESSION_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
} from '../../auth.constants';
import {
  InvalidCredentialsException,
  EmailNotVerifiedException,
} from '../../domain/exceptions/auth.exceptions';
import { UserRole } from '../../../users/domain';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userApplicationService: jest.Mocked<UserApplicationService>;
  let sessionService: jest.Mocked<ISessionRepository>;
  let tokenService: jest.Mocked<ITokenRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let sessionDomainService: jest.Mocked<SessionDomainService>;

  // Test data factory
  const createValidLoginRequest = (
    overrides: Partial<LoginRequest> = {},
  ): LoginRequest => ({
    email: 'john@example.com',
    password: 'SecurePass123!',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 Test Browser',
    ...overrides,
  });

  const createTestUser = (overrides: any = {}) => ({
    id: 'user-123',
    email: 'john@example.com',
    username: 'johndoe',
    passwordHash: '$2b$12$hashedpassword123',
    isEmailVerified: true,
    role: UserRole.USER,
    profile: {
      fullName: 'John Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    ...overrides,
  });

  const createTestTokens = () => ({
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
  });

  const createTestSession = () => ({
    sessionId: 'session-789',
    userId: 'user-123',
    refreshToken: 'refresh-token-456',
  });

  beforeEach(async () => {
    // Create mocks
    const mockUserApplicationService: jest.Mocked<UserApplicationService> = {
      findUserEntityByEmailOrUsername: jest.fn(),
    } as any;

    const mockSessionService: jest.Mocked<ISessionRepository> = {
      deleteSessionsByUserAgent: jest.fn(),
      getSessionFromRefreshToken: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as any;

    const mockTokenService: jest.Mocked<ITokenRepository> = {
      createTokensForUser: jest.fn(),
      save: jest.fn(),
      findByToken: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
    } as any;

    const mockPasswordHasher: jest.Mocked<IPasswordHasher> = {
      hash: jest.fn(),
      verify: jest.fn(),
    };

    const mockSessionDomainService: jest.Mocked<SessionDomainService> = {
      createSession: jest.fn(),
      revokeSession: jest.fn(),
    } as any;

    const mockEventEmitter: jest.Mocked<EventEmitter2> = {
      emit: jest.fn(),
      emitAsync: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: UserApplicationService,
          useValue: mockUserApplicationService,
        },
        {
          provide: SESSION_REPOSITORY_TOKEN,
          useValue: mockSessionService,
        },
        {
          provide: TOKEN_REPOSITORY_TOKEN,
          useValue: mockTokenService,
        },
        {
          provide: PASSWORD_HASHER_TOKEN,
          useValue: mockPasswordHasher,
        },
        {
          provide: SessionDomainService,
          useValue: mockSessionDomainService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
    userApplicationService = module.get(UserApplicationService);
    sessionService = module.get(SESSION_REPOSITORY_TOKEN);
    tokenService = module.get(TOKEN_REPOSITORY_TOKEN);
    passwordHasher = module.get(PASSWORD_HASHER_TOKEN);
    sessionDomainService = module.get(SessionDomainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Login', () => {
    it('should login user with email successfully', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser();
      const mockTokens = createTestTokens();
      const mockSession = createTestSession();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue(
        mockSession as any,
      );

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(
        userApplicationService.findUserEntityByEmailOrUsername,
      ).toHaveBeenCalledWith(request.email);
      expect(passwordHasher.verify).toHaveBeenCalledWith(
        expect.any(Password),
        mockUser.passwordHash,
      );
      expect(sessionService.deleteSessionsByUserAgent).toHaveBeenCalledWith(
        mockUser.id,
        request.userAgent,
      );
      expect(tokenService.createTokensForUser).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        request.userAgent,
        request.ipAddress,
        undefined,
        undefined,
      );
      expect(sessionService.getSessionFromRefreshToken).toHaveBeenCalledWith(
        mockTokens.refreshToken,
      );

      expect(result).toEqual({
        success: true,
        message: 'Login successful',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          fullName: mockUser.profile.fullName,
          avatar: mockUser.profile.avatar,
          role: mockUser.role,
        },
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        sessionId: mockSession.sessionId,
      });
    });

    it('should login user with username successfully', async () => {
      // Arrange
      const request = createValidLoginRequest({
        username: 'johndoe',
        email: undefined,
      });
      const mockUser = createTestUser();
      const mockTokens = createTestTokens();
      const mockSession = createTestSession();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue(
        mockSession as any,
      );

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(
        userApplicationService.findUserEntityByEmailOrUsername,
      ).toHaveBeenCalledWith(request.username);
      expect(result.success).toBe(true);
    });

    it('should handle missing session gracefully', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser();
      const mockTokens = createTestTokens();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.sessionId).toBe('unknown');
      expect(result.success).toBe(true);
    });
  });

  describe('Authentication Errors', () => {
    it('should throw InvalidCredentialsException when both email and username are missing', async () => {
      // Arrange
      const request = createValidLoginRequest({
        email: undefined,
        username: undefined,
      });

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(
        userApplicationService.findUserEntityByEmailOrUsername,
      ).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException when email is empty string', async () => {
      // Arrange
      const request = createValidLoginRequest({
        email: '',
        username: undefined,
      });

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidCredentialsException,
      );
    });

    it('should throw InvalidCredentialsException when user not found', async () => {
      // Arrange
      const request = createValidLoginRequest();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(
        userApplicationService.findUserEntityByEmailOrUsername,
      ).toHaveBeenCalledWith(request.email);
      expect(passwordHasher.verify).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException when user has no password hash', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser({ passwordHash: null });

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(passwordHasher.verify).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException when user has empty password hash', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser({ passwordHash: '' });

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(passwordHasher.verify).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentialsException when password verification fails', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        InvalidCredentialsException,
      );
      expect(passwordHasher.verify).toHaveBeenCalledWith(
        expect.any(Password),
        mockUser.passwordHash,
      );
      expect(sessionService.deleteSessionsByUserAgent).not.toHaveBeenCalled();
    });
  });

  describe('Email Verification', () => {
    it('should throw EmailNotVerifiedException when user email is not verified', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser({ isEmailVerified: false });

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        EmailNotVerifiedException,
      );
      expect(passwordHasher.verify).not.toHaveBeenCalled();
    });

    it('should proceed when user email is verified', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser({ isEmailVerified: true });
      const mockTokens = createTestTokens();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue({
        sessionId: 'session-123',
      } as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should clean up old sessions when userAgent is provided', async () => {
      // Arrange
      const request = createValidLoginRequest({
        userAgent: 'Mozilla/5.0 Safari',
      });
      const mockUser = createTestUser();
      const mockTokens = createTestTokens();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue({
        sessionId: 'session-123',
      } as any);

      // Act
      await useCase.execute(request);

      // Assert
      expect(sessionService.deleteSessionsByUserAgent).toHaveBeenCalledWith(
        mockUser.id,
        request.userAgent,
      );
    });

    it('should not clean up sessions when userAgent is missing', async () => {
      // Arrange
      const request = createValidLoginRequest({ userAgent: undefined });
      const mockUser = createTestUser();
      const mockTokens = createTestTokens();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue({
        sessionId: 'session-123',
      } as any);

      // Act
      await useCase.execute(request);

      // Assert
      expect(sessionService.deleteSessionsByUserAgent).not.toHaveBeenCalled();
    });

    it('should handle session cleanup errors gracefully', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser();
      const mockTokens = createTestTokens();
      const cleanupError = new Error('Session cleanup failed');

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockRejectedValue(cleanupError);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue({
        sessionId: 'session-123',
      } as any);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'Session cleanup failed',
      );
    });
  });

  describe('Token Generation', () => {
    it('should handle token creation errors', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser();
      const tokenError = new Error('Token creation failed');

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockRejectedValue(tokenError);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'Token creation failed',
      );
      expect(sessionService.getSessionFromRefreshToken).not.toHaveBeenCalled();
    });

    it('should pass correct parameters to token creation', async () => {
      // Arrange
      const request = createValidLoginRequest({
        ipAddress: '10.0.0.1',
        userAgent: 'Custom Browser 1.0',
      });
      const mockUser = createTestUser();
      const mockTokens = createTestTokens();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue({
        sessionId: 'session-123',
      } as any);

      // Act
      await useCase.execute(request);

      // Assert
      expect(tokenService.createTokensForUser).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        request.userAgent,
        request.ipAddress,
        undefined,
        undefined,
      );
    });
  });

  describe('Password Validation', () => {
    it('should create Password value object correctly', async () => {
      // Arrange
      const request = createValidLoginRequest({ password: 'TestPassword123!' });
      const mockUser = createTestUser();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockResolvedValue({} as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue({
        sessionId: 'session-123',
      } as any);

      // Act
      await useCase.execute(request);

      // Assert
      const passwordArg = passwordHasher.verify.mock.calls[0][0];
      expect(passwordArg).toBeInstanceOf(Password);
      expect(passwordArg.value).toBe('TestPassword123!');
    });

    it('should handle password hasher errors', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser();
      const hasherError = new Error('Password verification failed');

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockRejectedValue(hasherError);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(
        'Password verification failed',
      );
    });
  });

  describe('Result Structure', () => {
    it('should return correct login result structure', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser({
        id: 'test-user-id',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.ADMIN,
        profile: {
          fullName: 'Test User',
          avatar: 'test-avatar.jpg',
        },
      });
      const mockTokens = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };
      const mockSession = { sessionId: 'test-session-id' };

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue(
        mockSession as any,
      );

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Login successful',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          fullName: 'Test User',
          avatar: 'test-avatar.jpg',
          role: UserRole.ADMIN,
        },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        sessionId: 'test-session-id',
      });
    });

    it('should handle null avatar in user profile', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser({
        profile: {
          fullName: 'Test User',
          avatar: null,
        },
      });
      const mockTokens = createTestTokens();

      userApplicationService.findUserEntityByEmailOrUsername.mockResolvedValue(
        mockUser as any,
      );
      passwordHasher.verify.mockResolvedValue(true);
      sessionService.deleteSessionsByUserAgent.mockResolvedValue(undefined);
      tokenService.createTokensForUser.mockResolvedValue(mockTokens as any);
      sessionService.getSessionFromRefreshToken.mockResolvedValue({
        sessionId: 'session-123',
      } as any);

      // Act
      const result = await useCase.execute(request);

      // Assert
      expect(result.user.avatar).toBeNull();
    });
  });

  describe('Service Call Order', () => {
    it('should call services in correct sequence', async () => {
      // Arrange
      const request = createValidLoginRequest();
      const mockUser = createTestUser();
      const mockTokens = createTestTokens();
      const callOrder: string[] = [];

      userApplicationService.findUserEntityByEmailOrUsername.mockImplementation(
        async () => {
          callOrder.push('findUser');
          return mockUser as any;
        },
      );
      passwordHasher.verify.mockImplementation(async () => {
        callOrder.push('verifyPassword');
        return true;
      });
      sessionService.deleteSessionsByUserAgent.mockImplementation(async () => {
        callOrder.push('cleanupSessions');
      });
      tokenService.createTokensForUser.mockImplementation(async () => {
        callOrder.push('createTokens');
        return mockTokens as any;
      });
      sessionService.getSessionFromRefreshToken.mockImplementation(async () => {
        callOrder.push('getSession');
        return { sessionId: 'session-123' } as any;
      });

      // Act
      await useCase.execute(request);

      // Assert
      expect(callOrder).toEqual([
        'findUser',
        'verifyPassword',
        'cleanupSessions',
        'createTokens',
        'getSession',
      ]);
    });
  });
});
