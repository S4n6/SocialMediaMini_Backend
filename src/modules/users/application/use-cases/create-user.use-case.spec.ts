import { CreateUserUseCase } from './create-user.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IEventBus } from '../../../../infrastructure/events';
import { User, UserRole } from '../../domain/entities/user.entity';
import { UserProfile } from '../../domain/value-objects/user-profile.value-object';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    // Create mocks
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      searchUsers: jest.fn(),
      updateFollowRelationship: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as any;

    useCase = new CreateUserUseCase(mockUserRepository, mockEventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create user successfully', async () => {
      const command = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
        bio: 'Software developer',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute(command);

      expect(result).toBeDefined();
      expect(result.username).toBe('johndoe');
      expect(result.email).toBe('john@example.com');
      expect(result.fullName).toBe('John Doe');
      expect(result.isEmailVerified).toBe(false);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should throw error when email already exists', async () => {
      const command = {
        username: 'johndoe',
        email: 'existing@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
      };

      const existingUser = new User(
        'existing-id',
        'existinguser',
        'existing@example.com',
        new UserProfile({ fullName: 'Existing' }),
        { passwordHash: 'hash', createdAt: new Date() },
      );

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(useCase.execute(command)).rejects.toThrow(
        'User with email existing@example.com already exists',
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should throw error when username already exists', async () => {
      const command = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'SecurePass123!',
        fullName: 'New User',
      };

      const existingUser = new User(
        'existing-id',
        'existinguser',
        'other@example.com',
        new UserProfile({ fullName: 'Existing' }),
        { passwordHash: 'hash', createdAt: new Date() },
      );

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(existingUser);

      await expect(useCase.execute(command)).rejects.toThrow(
        'User with username existinguser already exists',
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should validate email format before creating', async () => {
      const command = {
        username: 'johndoe',
        email: 'invalid-email',
        password: 'SecurePass123!',
        fullName: 'John Doe',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(useCase.execute(command)).rejects.toThrow();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should validate username format before creating', async () => {
      const command = {
        username: 'ab', // Too short
        email: 'john@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(useCase.execute(command)).rejects.toThrow();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should create user with all profile fields', async () => {
      const command = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
        bio: 'Developer',
        location: 'New York',
        websiteUrl: 'https://johndoe.com',
        phoneNumber: '+1234567890',
        gender: 'male',
        dateOfBirth: new Date('1990-01-01'),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute(command);

      expect(result.bio).toBe('Developer');
      expect(result.location).toBe('New York');
      expect(result.websiteUrl).toBe('https://johndoe.com');
    });

    it('should emit UserRegisteredEvent', async () => {
      const command = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(command);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'user.registered',
        }),
      );
    });

    it('should not expose password hash in response', async () => {
      const command = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        fullName: 'John Doe',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      const result = await useCase.execute(command);

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('password');
    });
  });
});
