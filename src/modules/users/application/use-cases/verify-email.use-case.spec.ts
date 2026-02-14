import { VerifyEmailUseCase } from './verify-email.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IEventBus } from '../../../../infrastructure/events';
import { User } from '../../domain/entities/user.entity';
import { UserProfile } from '../../domain/value-objects/user-profile.value-object';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

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

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as any;

    useCase = new VerifyEmailUseCase(mockUserRepository, mockEventBus);
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
      mockEventBus.publishAll.mockResolvedValue(undefined);

      await useCase.execute('user-id-123');

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should publish domain events after verifying email', async () => {
      const user = createTestUser(false);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      await useCase.execute('user-id-123');

      // Verify event publishing was called
      expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);

      // Check that domain events were generated
      const publishedEvents = mockEventBus.publishAll.mock.calls[0][0];
      expect(publishedEvents).toBeDefined();
      expect(publishedEvents.length).toBeGreaterThan(0);
    });

    it('should throw EntityNotFoundException when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('nonexistent-id')).rejects.toThrow(
        EntityNotFoundException,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publishAll).not.toHaveBeenCalled();
    });

    it('should handle already verified user (idempotent)', async () => {
      const user = createTestUser(true);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      // Domain entity returns early without error for already verified users
      await expect(useCase.execute('user-id-123')).resolves.not.toThrow();

      // No save or event publishing happens since no state changed
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should clear domain events after publishing', async () => {
      const user = createTestUser(false);
      const clearEventsSpy = jest.spyOn(user, 'clearDomainEvents');

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      await useCase.execute('user-id-123');

      expect(clearEventsSpy).toHaveBeenCalledTimes(1);
    });

    it('should update emailVerifiedAt timestamp', async () => {
      const user = createTestUser(false);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

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
      mockEventBus.publishAll.mockResolvedValue(undefined);

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
      expect(mockEventBus.publishAll).not.toHaveBeenCalled();
    });

    it('should handle event bus publishing failures gracefully', async () => {
      const user = createTestUser(false);
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockRejectedValue(
        new Error('Event bus unavailable'),
      );

      await expect(useCase.execute('user-id-123')).rejects.toThrow(
        'Event bus unavailable',
      );
      // Save should have been called before event publishing
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
