import { FollowUserUseCase, UnfollowUserUseCase } from './follow-user.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { IEventBus } from '../../../../infrastructure/events';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { UserProfile } from '../../domain/value-objects/user-profile.value-object';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';
import {
  CannotFollowSelfException,
  AlreadyFollowingUserException,
  NotFollowingUserException,
} from '../../domain/exceptions/user.exceptions';

// Valid UUIDs for testing
const USER_1_UUID = '550e8400-e29b-41d4-a716-446655440001';
const USER_2_UUID = '550e8400-e29b-41d4-a716-446655440002';

describe('FollowUserUseCase', () => {
  let useCase: FollowUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  const createTestUser = (id: string, username: string): User => {
    return new User(
      id,
      username,
      `${username}@example.com`,
      new UserProfile({ fullName: username }),
      {
        passwordHash: 'hash',
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        createdAt: new Date('2023-01-01'),
      },
    );
  };

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      updateFollowRelationship: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      searchUsers: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as any;

    useCase = new FollowUserUseCase(mockUserRepository, mockEventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should follow user successfully', async () => {
      const follower = createTestUser(USER_1_UUID, 'follower');
      const followee = createTestUser(USER_2_UUID, 'followee');

      mockUserRepository.findById
        .mockResolvedValueOnce(follower)
        .mockResolvedValueOnce(followee);
      mockUserRepository.updateFollowRelationship.mockResolvedValue(undefined);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(USER_1_UUID, USER_2_UUID);

      expect(mockUserRepository.findById).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.updateFollowRelationship).toHaveBeenCalledTimes(
        1,
      );
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should throw EntityNotFoundException when follower not found', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(createTestUser(USER_2_UUID, 'followee'));

      await expect(useCase.execute(USER_1_UUID, USER_2_UUID)).rejects.toThrow(
        EntityNotFoundException,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw EntityNotFoundException when followee not found', async () => {
      mockUserRepository.findById
        .mockResolvedValueOnce(createTestUser(USER_1_UUID, 'follower'))
        .mockResolvedValueOnce(null);

      await expect(useCase.execute(USER_1_UUID, USER_2_UUID)).rejects.toThrow(
        EntityNotFoundException,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when trying to follow self', async () => {
      const user = createTestUser(USER_1_UUID, 'user');

      mockUserRepository.findById.mockResolvedValue(user);

      await expect(useCase.execute(USER_1_UUID, USER_1_UUID)).rejects.toThrow(
        'Cannot follow yourself',
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should throw AlreadyFollowingUserException when already following', async () => {
      const follower = createTestUser(USER_1_UUID, 'follower');
      const followee = createTestUser(USER_2_UUID, 'followee');

      // Simulate already following
      follower.follow(USER_2_UUID, 'followee');
      follower.clearDomainEvents();

      mockUserRepository.findById
        .mockResolvedValueOnce(follower)
        .mockResolvedValueOnce(followee);

      await expect(useCase.execute(USER_1_UUID, USER_2_UUID)).rejects.toThrow(
        AlreadyFollowingUserException,
      );
    });

    it('should emit UserFollowedEvent', async () => {
      const follower = createTestUser(USER_1_UUID, 'follower');
      const followee = createTestUser(USER_2_UUID, 'followee');

      mockUserRepository.findById
        .mockResolvedValueOnce(follower)
        .mockResolvedValueOnce(followee);
      mockUserRepository.updateFollowRelationship.mockResolvedValue(undefined);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(USER_1_UUID, USER_2_UUID);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'user.followed',
        }),
      );
    });

    it('should update both follower and followee', async () => {
      const follower = createTestUser(USER_1_UUID, 'follower');
      const followee = createTestUser(USER_2_UUID, 'followee');

      mockUserRepository.findById
        .mockResolvedValueOnce(follower)
        .mockResolvedValueOnce(followee);
      mockUserRepository.updateFollowRelationship.mockResolvedValue(undefined);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(USER_1_UUID, USER_2_UUID);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: USER_1_UUID }),
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: USER_2_UUID }),
      );
    });
  });
});

describe('UnfollowUserUseCase', () => {
  let useCase: UnfollowUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  const createTestUser = (id: string, username: string): User => {
    return new User(
      id,
      username,
      `${username}@example.com`,
      new UserProfile({ fullName: username }),
      {
        passwordHash: 'hash',
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        createdAt: new Date('2023-01-01'),
      },
    );
  };

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      updateFollowRelationship: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      searchUsers: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as any;

    useCase = new UnfollowUserUseCase(mockUserRepository, mockEventBus);
  });

  describe('execute', () => {
    it('should unfollow user successfully', async () => {
      const follower = createTestUser(USER_1_UUID, 'follower');
      const followee = createTestUser(USER_2_UUID, 'followee');

      // Setup: already following
      follower.follow(USER_2_UUID, 'followee');
      followee.addFollower(USER_1_UUID);
      follower.clearDomainEvents();

      mockUserRepository.findById
        .mockResolvedValueOnce(follower)
        .mockResolvedValueOnce(followee);
      mockUserRepository.updateFollowRelationship.mockResolvedValue(undefined);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(USER_1_UUID, USER_2_UUID);

      expect(mockUserRepository.updateFollowRelationship).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        false,
      );
      expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should throw NotFollowingUserException when not following', async () => {
      const follower = createTestUser(USER_1_UUID, 'follower');
      const followee = createTestUser(USER_2_UUID, 'followee');

      mockUserRepository.findById
        .mockResolvedValueOnce(follower)
        .mockResolvedValueOnce(followee);

      await expect(useCase.execute(USER_1_UUID, USER_2_UUID)).rejects.toThrow(
        NotFollowingUserException,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should emit UserUnfollowedEvent', async () => {
      const follower = createTestUser(USER_1_UUID, 'follower');
      const followee = createTestUser(USER_2_UUID, 'followee');

      follower.follow(USER_2_UUID, 'followee');
      followee.addFollower(USER_1_UUID);
      follower.clearDomainEvents();

      mockUserRepository.findById
        .mockResolvedValueOnce(follower)
        .mockResolvedValueOnce(followee);
      mockUserRepository.updateFollowRelationship.mockResolvedValue(undefined);
      mockUserRepository.save.mockResolvedValue(undefined);
      mockEventBus.publish.mockResolvedValue(undefined);

      await useCase.execute(USER_1_UUID, USER_2_UUID);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'user.unfollowed',
        }),
      );
    });
  });
});
