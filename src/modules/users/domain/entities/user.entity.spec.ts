import { User, UserRole, UserStatus } from './user.entity';
import { UserProfile } from '../value-objects/user-profile.value-object';
import {
  UserAccountInactiveException,
  EmailNotVerifiedException,
  ProfileUpdateTooFrequentException,
} from '../exceptions/user.exceptions';

describe('User Entity', () => {
  const createTestProfile = (): UserProfile => {
    return new UserProfile({
      fullName: 'John Doe',
      bio: 'Test bio',
      avatar: 'https://example.com/avatar.jpg',
      location: 'New York',
      websiteUrl: 'https://example.com',
      phoneNumber: '+1234567890',
      gender: 'male',
      dateOfBirth: new Date('1990-01-01'),
    });
  };

  const createTestUser = (options?: {
    id?: string;
    username?: string;
    email?: string;
    status?: UserStatus;
    isEmailVerified?: boolean;
  }): User => {
    return new User(
      options?.id || 'user-123',
      options?.username || 'johndoe',
      options?.email || 'john@example.com',
      createTestProfile(),
      {
        passwordHash: 'hashed_password',
        role: UserRole.USER,
        status: options?.status || UserStatus.ACTIVE,
        isEmailVerified: options?.isEmailVerified ?? true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    );
  };

  describe('creation', () => {
    it('should create user with all properties', () => {
      const user = createTestUser();

      expect(user.id).toBe('user-123');
      expect(user.username).toBe('johndoe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe(UserRole.USER);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.isEmailVerified).toBe(true);
    });

    it('should emit UserRegisteredEvent for new user', () => {
      const user = new User(
        'new-user',
        'newuser',
        'new@example.com',
        createTestProfile(),
      );

      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('user.registered');
    });

    it('should not emit event for existing user', () => {
      const user = createTestUser();

      const events = user.getDomainEvents();
      expect(events).toHaveLength(0);
    });
  });

  describe('email verification', () => {
    it('should verify email successfully', () => {
      const user = createTestUser({ isEmailVerified: false });

      user.verifyEmail();

      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerifiedAt).toBeDefined();
      expect(user.emailVerifiedAt).toBeInstanceOf(Date);

      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('user.email.verified');
    });

    it('should not change state when email already verified', () => {
      const user = createTestUser({ isEmailVerified: true });
      const verifiedAtBefore = user.emailVerifiedAt;

      user.verifyEmail();

      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerifiedAt).toBe(verifiedAtBefore);
      expect(user.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('profile update', () => {
    it('should update profile successfully', () => {
      const user = createTestUser();
      const newProfile = new UserProfile({
        fullName: 'Jane Doe',
        bio: 'Updated bio',
      });

      user.updateProfile(newProfile);

      expect(user.profile.fullName).toBe('Jane Doe');
      expect(user.profile.bio).toBe('Updated bio');
      expect(user.lastProfileUpdate).toBeDefined();

      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('user.profile.updated');
    });

    it('should throw error when updating too frequently', () => {
      const user = createTestUser();
      const newProfile = new UserProfile({ fullName: 'New Name' });

      user.updateProfile(newProfile);
      user.clearDomainEvents();

      // Try to update immediately
      const anotherProfile = new UserProfile({ fullName: 'Another Name' });
      expect(() => user.updateProfile(anotherProfile)).toThrow(
        ProfileUpdateTooFrequentException,
      );
    });
  });

  describe('status management', () => {
    it('should change user status to ACTIVE', () => {
      const user = createTestUser({ status: UserStatus.INACTIVE });

      user.changeStatus(UserStatus.ACTIVE);

      expect(user.status).toBe(UserStatus.ACTIVE);
    });

    it('should change user status to INACTIVE', () => {
      const user = createTestUser({ status: UserStatus.ACTIVE });

      user.changeStatus(UserStatus.INACTIVE);

      expect(user.status).toBe(UserStatus.INACTIVE);
    });

    it('should change user status to SUSPENDED', () => {
      const user = createTestUser({ status: UserStatus.ACTIVE });

      user.changeStatus(UserStatus.SUSPENDED);

      expect(user.status).toBe(UserStatus.SUSPENDED);
    });

    it('should change user status to BANNED', () => {
      const user = createTestUser({ status: UserStatus.ACTIVE });

      user.changeStatus(UserStatus.BANNED);

      expect(user.status).toBe(UserStatus.BANNED);
    });
  });

  describe('statistics', () => {
    it('should return correct stats', () => {
      const user = createTestUser();

      const stats = user.getStats();

      expect(stats).toHaveProperty('followersCount');
      expect(stats).toHaveProperty('followingCount');
      expect(stats.followingCount).toBe(0);
    });
  });

  describe('checking capabilities', () => {
    it('should return true for active account', () => {
      const user = createTestUser({ status: UserStatus.ACTIVE });
      expect(user.canPerformAction()).toBe(true);
    });

    it('should throw error for inactive account', () => {
      const user = createTestUser({ status: UserStatus.INACTIVE });
      expect(() => user.canPerformAction()).toThrow(
        UserAccountInactiveException,
      );
    });

    it('should throw error for suspended account', () => {
      const user = createTestUser({ status: UserStatus.SUSPENDED });
      expect(() => user.canPerformAction()).toThrow(
        UserAccountInactiveException,
      );
    });

    it('should throw error for banned account', () => {
      const user = createTestUser({ status: UserStatus.BANNED });
      expect(() => user.canPerformAction()).toThrow(
        UserAccountInactiveException,
      );
    });
  });
});
