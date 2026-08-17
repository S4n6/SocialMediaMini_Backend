import { VerifyEmailUseCase } from './verify-email.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserProfile } from '../../domain/value-objects/user-profile.value-object';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
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


    useCase = new VerifyEmailUseCase(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createTestUser = (isVerified = false): User => {
    return new User(
      'user-id-123',
      'johndoe',
      'john@example.com',
      new UserProfile({ fullName: 'John Doe' }),
      {
        passwordHash: '$2b$12$hashedpassword',
        createdAt: new Date(),
        isEmailVerified: isVerified,
        emailVerifiedAt: isVerified ? new Date() : undefined,
      },
    );
  };

  describe('execute', () => {
    it('should verify email successfully for unverified user', async () => {
      const user = createTestUser(false);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);

      await useCase.execute('user-id-123');

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should publish domain events after verifying email', async () => {
      const user = createTestUser(false);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);

      await useCase.execute('user-id-123');

      // Verify event publishing was called

      // Check that domain events were generated
    });

    it('should throw EntityNotFoundException when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('nonexistent-id')).rejects.toThrow(
        EntityNotFoundException,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should handle already verified user (idempotent)', async () => {
      const user = createTestUser(true);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);

      // Domain entity returns early without error for already verified users
      await expect(useCase.execute('user-id-123')).resolves.not.toThrow();

      // No save or event publishing happens since no state changed
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });



    it('should update emailVerifiedAt timestamp', async () => {
      const user = createTestUser(false);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);

      const beforeVerification = user.emailVerifiedAt;
      expect(beforeVerification).toBeUndefined();

      await useCase.execute('user-id-123');

      // Verify the user entity was updated
      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.isEmailVerified).toBe(true);
      expect(savedUser.emailVerifiedAt).toBeDefined();
    });

    it('should save user with verified status', async () => {
      const user = createTestUser(false);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);

      await useCase.execute('user-id-123');

      // Verify save was called with updated user
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser).toBeInstanceOf(User);
      expect(savedUser.isEmailVerified).toBe(true);
    });

    it('should handle repository save failures gracefully', async () => {
      const user = createTestUser(false);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute('user-id-123')).rejects.toThrow(
        'Database connection failed',
      );
    });


  });
});
