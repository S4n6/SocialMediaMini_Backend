import { UpdateProfileUseCase } from './update-profile.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IEventBus } from '../../../../infrastructure/events';
import { User } from '../../domain/entities/user.entity';
import { UserProfile } from '../../domain/value-objects/user-profile.value-object';
import { UpdateProfileDto } from '../dto/user.dto';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
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

    useCase = new UpdateProfileUseCase(mockUserRepository, mockEventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createTestUser = (overrides?: any): User => {
    return new User(
      'user-id-123',
      'johndoe',
      'john@example.com',
      new UserProfile({
        fullName: 'John Doe',
        bio: 'Original bio',
        avatar: 'https://example.com/avatar.jpg',
        location: 'New York',
      }),
      {
        passwordHash: '$2b$12$hashedpassword',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        lastProfileUpdate: new Date(Date.now() - 48 * 60 * 60 * 1000),
        ...overrides,
      },
    );
  };

  describe('execute', () => {
    it('should update profile successfully', async () => {
      const user = createTestUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      const updateDto: UpdateProfileDto = {
        fullName: 'John Updated Doe',
        bio: 'Updated bio',
        location: 'Los Angeles',
      };

      const result = await useCase.execute('user-id-123', updateDto);

      expect(result).toBeDefined();
      expect(result.fullName).toBe('John Updated Doe');
      expect(result.bio).toBe('Updated bio');
      expect(result.location).toBe('Los Angeles');
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should publish UserProfileUpdatedEvent when profile is updated', async () => {
      const user = createTestUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      const updateDto: UpdateProfileDto = {
        fullName: 'John Updated Doe',
        bio: 'Updated bio',
      };

      await useCase.execute('user-id-123', updateDto);

      // Verify event publishing was called
      expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);

      // Check that domain events were generated
      const publishedEvents = mockEventBus.publishAll.mock.calls[0][0];
      expect(publishedEvents).toBeDefined();
      expect(publishedEvents.length).toBeGreaterThan(0);
    });

    it('should throw EntityNotFoundException when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const updateDto: UpdateProfileDto = {
        fullName: 'John Doe',
      };

      await expect(
        useCase.execute('nonexistent-id', updateDto),
      ).rejects.toThrow(EntityNotFoundException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publishAll).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const user = createTestUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      const updateDto: UpdateProfileDto = {
        bio: 'Only bio updated',
      };

      const result = await useCase.execute('user-id-123', updateDto);

      // Original fields should remain
      expect(result.fullName).toBe('John Doe');
      expect(result.location).toBe('New York');
      // Updated field
      expect(result.bio).toBe('Only bio updated');
    });

    it('should handle updating all profile fields', async () => {
      const user = createTestUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      const updateDto: UpdateProfileDto = {
        fullName: 'Jane Smith',
        bio: 'New bio',
        avatar: 'https://example.com/new-avatar.jpg',
        location: 'San Francisco',
        websiteUrl: 'https://janesmith.com',
        dateOfBirth: '1990-01-01',
        phoneNumber: '+1234567890',
        gender: 'female',
      };

      const result = await useCase.execute('user-id-123', updateDto);

      expect(result.fullName).toBe('Jane Smith');
      expect(result.bio).toBe('New bio');
      expect(result.avatar).toBe('https://example.com/new-avatar.jpg');
      expect(result.location).toBe('San Francisco');
      expect(result.websiteUrl).toBe('https://janesmith.com');
    });

    it('should enforce 24-hour throttling rule', async () => {
      // User updated profile 12 hours ago
      const user = createTestUser({
        lastProfileUpdate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      });
      mockUserRepository.findById.mockResolvedValue(user);

      const updateDto: UpdateProfileDto = {
        fullName: 'Updated Name',
      };

      await expect(useCase.execute('user-id-123', updateDto)).rejects.toThrow();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publishAll).not.toHaveBeenCalled();
    });

    it('should allow profile update after 24 hours', async () => {
      // User updated profile 25 hours ago
      const user = createTestUser({
        lastProfileUpdate: new Date(Date.now() - 25 * 60 * 60 * 1000),
      });
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      const updateDto: UpdateProfileDto = {
        fullName: 'Updated Name',
      };

      await expect(
        useCase.execute('user-id-123', updateDto),
      ).resolves.toBeDefined();
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should clear domain events after publishing', async () => {
      const user = createTestUser();
      const clearEventsSpy = jest.spyOn(user, 'clearDomainEvents');

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      const updateDto: UpdateProfileDto = {
        fullName: 'Updated Name',
      };

      await useCase.execute('user-id-123', updateDto);

      expect(clearEventsSpy).toHaveBeenCalledTimes(1);
    });

    it('should preserve follower/following counts', async () => {
      const user = createTestUser();
      // Simulate some followers/following
      jest.spyOn(user, 'followersCount', 'get').mockReturnValue(100);
      jest.spyOn(user, 'followingCount', 'get').mockReturnValue(50);

      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      const updateDto: UpdateProfileDto = {
        bio: 'Updated bio',
      };

      const result = await useCase.execute('user-id-123', updateDto);

      expect(result.followersCount).toBe(100);
      expect(result.followingCount).toBe(50);
    });

    it('should validate profile data through UserProfile VO', async () => {
      const user = createTestUser();
      mockUserRepository.findById.mockResolvedValue(user);

      const invalidDto: UpdateProfileDto = {
        fullName: 'A', // Too short (min 2 chars)
      };

      await expect(
        useCase.execute('user-id-123', invalidDto),
      ).rejects.toThrow();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should handle partial updates without overwriting existing data', async () => {
      const user = createTestUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      const updateDto: UpdateProfileDto = {
        websiteUrl: 'https://newsite.com',
      };

      const result = await useCase.execute('user-id-123', updateDto);

      // All original fields should be preserved
      expect(result.fullName).toBe('John Doe');
      expect(result.bio).toBe('Original bio');
      expect(result.avatar).toBe('https://example.com/avatar.jpg');
      expect(result.location).toBe('New York');
      // Only updated field
      expect(result.websiteUrl).toBe('https://newsite.com');
    });

    it('should return updated timestamps', async () => {
      const user = createTestUser();
      mockUserRepository.findById.mockResolvedValue(user);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publishAll.mockResolvedValue(undefined);

      const updateDto: UpdateProfileDto = {
        bio: 'Updated bio',
      };

      const result = await useCase.execute('user-id-123', updateDto);

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });
  });
});
