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

  describe('canCreatePost', () => {
    it('should return true for verified user with account older than 1 hour', () => {
      const user = new User(
        'user-123',
        'johndoe',
        'john@example.com',
        createTestProfile(),
        {
          passwordHash: 'hashed_password',
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          updatedAt: new Date(),
        },
      );

      expect(user.canCreatePost()).toBe(true);
    });

    it('should return false for unverified user', () => {
      const user = createTestUser({ isEmailVerified: false });

      expect(user.canCreatePost()).toBe(false);
    });

    it('should return false for inactive user', () => {
      const user = createTestUser({ status: UserStatus.INACTIVE });

      expect(user.canCreatePost()).toBe(false);
    });

    it('should return false for suspended user', () => {
      const user = createTestUser({ status: UserStatus.SUSPENDED });

      expect(user.canCreatePost()).toBe(false);
    });

    it('should return false for account younger than 1 hour', () => {
      const user = new User(
        'new-user',
        'newuser',
        'new@example.com',
        createTestProfile(),
        {
          passwordHash: 'hashed_password',
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          updatedAt: new Date(),
        },
      );

      expect(user.canCreatePost()).toBe(false);
    });

    it('should return true for account exactly 1 hour old', () => {
      const user = new User(
        'user-123',
        'johndoe',
        'john@example.com',
        createTestProfile(),
        {
          passwordHash: 'hashed_password',
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 60 * 60 * 1000), // Exactly 1 hour ago
          updatedAt: new Date(),
        },
      );

      expect(user.canCreatePost()).toBe(true);
    });
  });

  describe('canComment', () => {
    it('should return true for verified and active user', () => {
      const user = createTestUser({ isEmailVerified: true });

      expect(user.canComment()).toBe(true);
    });

    it('should return false for unverified user', () => {
      const user = createTestUser({ isEmailVerified: false });

      expect(user.canComment()).toBe(false);
    });

    it('should return false for inactive user', () => {
      const user = createTestUser({ status: UserStatus.INACTIVE });

      expect(user.canComment()).toBe(false);
    });

    it('should return false for suspended user', () => {
      const user = createTestUser({ status: UserStatus.SUSPENDED });

      expect(user.canComment()).toBe(false);
    });

    it('should return false for banned user', () => {
      const user = createTestUser({ status: UserStatus.BANNED });

      expect(user.canComment()).toBe(false);
    });

    it('should return true for new verified account (no age restriction)', () => {
      const user = new User(
        'new-user',
        'newuser',
        'new@example.com',
        createTestProfile(),
        {
          passwordHash: 'hashed_password',
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          createdAt: new Date(), // Just created
          updatedAt: new Date(),
        },
      );

      expect(user.canComment()).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return stats for verified user without throwing', () => {
      const user = createTestUser({ isEmailVerified: true });

      const stats = user.getStats();

      expect(stats).toBeDefined();
      expect(stats.isEmailVerified).toBe(true);
      expect(stats.canComment).toBe(true);
      expect(typeof stats.canCreatePost).toBe('boolean');
    });

    it('should return stats for unverified user without throwing', () => {
      const user = createTestUser({ isEmailVerified: false });

      const stats = user.getStats();

      expect(stats).toBeDefined();
      expect(stats.isEmailVerified).toBe(false);
      expect(stats.canComment).toBe(false);
      expect(stats.canCreatePost).toBe(false);
    });

    it('should return stats for inactive user without throwing', () => {
      const user = createTestUser({ status: UserStatus.INACTIVE });

      const stats = user.getStats();

      expect(stats).toBeDefined();
      expect(stats.canComment).toBe(false);
      expect(stats.canCreatePost).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should update password with valid bcrypt hash', () => {
      const user = createTestUser();
      const validBcryptHash =
        '$2b$12$KIXqRz8YhJXPl5K.8p5qHO7eW.TfZpVJPxZ.KxQdJ2Y7Z8L0Y5K.K';

      user.updatePassword(validBcryptHash);

      expect(user.passwordHash).toBe(validBcryptHash);
    });

    it('should throw error for empty password hash', () => {
      const user = createTestUser();

      expect(() => user.updatePassword('')).toThrow(
        'Password hash cannot be empty',
      );
    });

    it('should throw error for invalid hash format (plain text)', () => {
      const user = createTestUser();

      expect(() => user.updatePassword('plaintext')).toThrow(
        'Invalid password hash format',
      );
    });

    it('should throw error for invalid bcrypt hash (wrong prefix)', () => {
      const user = createTestUser();
      const invalidHash =
        '$3a$12$KIXqRz8YhJXPl5K.8p5qHO7eW.TfZpVJPxZ.KxQdJ2Y7Z8L0Y5K.K';

      expect(() => user.updatePassword(invalidHash)).toThrow(
        'Invalid password hash format',
      );
    });

    it('should throw error for bcrypt hash with wrong length', () => {
      const user = createTestUser();
      const shortHash = '$2b$12$short';

      expect(() => user.updatePassword(shortHash)).toThrow(
        'Invalid password hash format',
      );
    });

    it('should accept bcrypt hash with $2a$ prefix', () => {
      const user = createTestUser();
      const hash2a =
        '$2a$12$KIXqRz8YhJXPl5K.8p5qHO7eW.TfZpVJPxZ.KxQdJ2Y7Z8L0Y5K.K';

      expect(() => user.updatePassword(hash2a)).not.toThrow();
    });

    it('should accept bcrypt hash with $2y$ prefix', () => {
      const user = createTestUser();
      const hash2y =
        '$2y$12$KIXqRz8YhJXPl5K.8p5qHO7eW.TfZpVJPxZ.KxQdJ2Y7Z8L0Y5K.K';

      expect(() => user.updatePassword(hash2y)).not.toThrow();
    });
  });

  describe('following limits', () => {
    it('should return false when below following limit', () => {
      const user = createTestUser();
      // Set following count below limit
      user.setFollowingAndFollowers(
        Array.from({ length: 100 }, (_, i) => `user-${i}`),
        [],
      );

      expect(user.hasReachedFollowingLimit()).toBe(false);
    });

    it('should return true when reached following limit (7500)', () => {
      const user = createTestUser();
      // Set following count at limit
      user.setFollowingAndFollowers(
        Array.from({ length: 7500 }, (_, i) => `user-${i}`),
        [],
      );

      expect(user.hasReachedFollowingLimit()).toBe(true);
    });

    it('should return true when exceeded following limit', () => {
      const user = createTestUser();
      user.setFollowingAndFollowers(
        Array.from({ length: 8000 }, (_, i) => `user-${i}`),
        [],
      );

      expect(user.hasReachedFollowingLimit()).toBe(true);
    });
  });

  describe('popular user detection', () => {
    it('should return false for users with less than 10k followers', () => {
      const user = createTestUser();
      user.setFollowingAndFollowers(
        [],
        Array.from({ length: 5000 }, (_, i) => `follower-${i}`),
      );

      expect(user.isPopularUser()).toBe(false);
    });

    it('should return true for users with exactly 10k followers', () => {
      const user = createTestUser();
      user.setFollowingAndFollowers(
        [],
        Array.from({ length: 10000 }, (_, i) => `follower-${i}`),
      );

      expect(user.isPopularUser()).toBe(true);
    });

    it('should return true for users with more than 10k followers', () => {
      const user = createTestUser();
      user.setFollowingAndFollowers(
        [],
        Array.from({ length: 15000 }, (_, i) => `follower-${i}`),
      );

      expect(user.isPopularUser()).toBe(true);
    });
  });

  describe('verified user status', () => {
    it('should return true for admin users', () => {
      const user = new User(
        'admin-123',
        'admin',
        'admin@example.com',
        createTestProfile(),
        {
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          createdAt: new Date(),
        },
      );

      expect(user.isVerifiedUser()).toBe(true);
    });

    it('should return true for moderator users', () => {
      const user = new User(
        'mod-123',
        'moderator',
        'mod@example.com',
        createTestProfile(),
        {
          role: UserRole.MODERATOR,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          createdAt: new Date(),
        },
      );

      expect(user.isVerifiedUser()).toBe(true);
    });

    it('should return true for popular users (10k+ followers)', () => {
      const user = createTestUser();
      user.setFollowingAndFollowers(
        [],
        Array.from({ length: 10000 }, (_, i) => `follower-${i}`),
      );

      expect(user.isVerifiedUser()).toBe(true);
    });

    it('should return false for regular users', () => {
      const user = createTestUser();

      expect(user.isVerifiedUser()).toBe(false);
    });
  });

  describe('fresh account detection', () => {
    it('should return true for accounts less than 24 hours old', () => {
      const user = new User(
        'new-user',
        'newuser',
        'new@example.com',
        createTestProfile(),
        {
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          updatedAt: new Date(),
        },
      );

      expect(user.isFreshAccount()).toBe(true);
    });

    it('should return false for accounts exactly 24 hours old', () => {
      const user = new User(
        'old-user',
        'olduser',
        'old@example.com',
        createTestProfile(),
        {
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Exactly 24 hours ago
          updatedAt: new Date(),
        },
      );

      expect(user.isFreshAccount()).toBe(false);
    });

    it('should return false for accounts older than 24 hours', () => {
      const user = new User(
        'old-user',
        'olduser',
        'old@example.com',
        createTestProfile(),
        {
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
          updatedAt: new Date(),
        },
      );

      expect(user.isFreshAccount()).toBe(false);
    });
  });

  describe('mutual followers', () => {
    it('should return empty array when no mutual followers', () => {
      const user1 = createTestUser({ id: 'user-1' });
      const user2 = createTestUser({ id: 'user-2' });

      user1.setFollowingAndFollowers([], ['follower-a', 'follower-b']);
      user2.setFollowingAndFollowers([], ['follower-c', 'follower-d']);

      const mutual = user1.getMutualFollowerIds(user2);

      expect(mutual).toEqual([]);
    });

    it('should return mutual follower IDs', () => {
      const user1 = createTestUser({ id: 'user-1' });
      const user2 = createTestUser({ id: 'user-2' });

      user1.setFollowingAndFollowers([], ['shared-1', 'shared-2', 'unique-a']);
      user2.setFollowingAndFollowers([], ['shared-1', 'shared-2', 'unique-b']);

      const mutual = user1.getMutualFollowerIds(user2);

      expect(mutual).toHaveLength(2);
      expect(mutual).toContain('shared-1');
      expect(mutual).toContain('shared-2');
    });
  });

  describe('follow relationship checks', () => {
    it('should correctly check if following a user', () => {
      const user = createTestUser();
      user.setFollowingAndFollowers(['user-123', 'user-456'], []);

      expect(user.isFollowing('user-123')).toBe(true);
      expect(user.isFollowing('user-456')).toBe(true);
      expect(user.isFollowing('user-789')).toBe(false);
    });

    it('should correctly check if followed by a user', () => {
      const user = createTestUser();
      user.setFollowingAndFollowers([], ['follower-1', 'follower-2']);

      expect(user.isFollowedBy('follower-1')).toBe(true);
      expect(user.isFollowedBy('follower-2')).toBe(true);
      expect(user.isFollowedBy('follower-3')).toBe(false);
    });
  });

  describe('moderation capabilities', () => {
    it('should return true for admin can moderate', () => {
      const admin = new User(
        'admin-id',
        'admin',
        'admin@example.com',
        createTestProfile(),
        { role: UserRole.ADMIN, createdAt: new Date() },
      );

      expect(admin.canModerate()).toBe(true);
      expect(admin.isAdmin()).toBe(true);
    });

    it('should return true for moderator can moderate', () => {
      const mod = new User(
        'mod-id',
        'moderator',
        'mod@example.com',
        createTestProfile(),
        { role: UserRole.MODERATOR, createdAt: new Date() },
      );

      expect(mod.canModerate()).toBe(true);
      expect(mod.isAdmin()).toBe(false);
    });

    it('should return false for regular user cannot moderate', () => {
      const user = createTestUser();

      expect(user.canModerate()).toBe(false);
      expect(user.isAdmin()).toBe(false);
    });
  });

  describe('profile update throttling', () => {
    it('should allow profile update when never updated before', () => {
      const user = createTestUser();
      const newProfile = new UserProfile({ fullName: 'New Name' });

      expect(() => user.updateProfile(newProfile)).not.toThrow();
    });

    it('should throw error when updating within 24 hours', () => {
      const user = createTestUser();
      const profile1 = new UserProfile({ fullName: 'First Update' });

      // First update
      user.updateProfile(profile1);
      user.clearDomainEvents();

      // Attempt second update immediately
      const profile2 = new UserProfile({ fullName: 'Second Update' });
      expect(() => user.updateProfile(profile2)).toThrow(
        ProfileUpdateTooFrequentException,
      );
    });

    it('should include next allowed update time in error', () => {
      const user = createTestUser();
      const profile1 = new UserProfile({ fullName: 'First Update' });

      user.updateProfile(profile1);

      const profile2 = new UserProfile({ fullName: 'Second Update' });
      try {
        user.updateProfile(profile2);
        fail('Should have thrown ProfileUpdateTooFrequentException');
      } catch (error) {
        expect(error).toBeInstanceOf(ProfileUpdateTooFrequentException);
        expect(error.message).toContain('Profile can be updated again after');
      }
    });
  });

  describe('lastVerificationSentAt tracking', () => {
    it('should update lastVerificationSentAt timestamp', () => {
      const user = createTestUser();
      const timestamp = new Date('2024-06-15T10:00:00Z');

      user.updateLastVerificationSentAt(timestamp);

      expect(user.lastVerificationSentAt).toEqual(timestamp);
    });

    it('should return undefined when never sent', () => {
      const user = createTestUser();

      expect(user.lastVerificationSentAt).toBeUndefined();
    });

    it('should update the updatedAt timestamp', () => {
      const user = createTestUser();
      const oldUpdatedAt = user.updatedAt;
      const timestamp = new Date();

      // Wait a bit to ensure timestamp difference
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000);

      user.updateLastVerificationSentAt(timestamp);

      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });
  });

  describe('domain validation', () => {
    it('should throw error when username is empty', () => {
      const user = new User(
        'user-id',
        '',
        'test@example.com',
        createTestProfile(),
      );

      expect(() => user.validate()).toThrow('Username is required');
    });

    it('should throw error when email is empty', () => {
      const user = new User('user-id', 'username', '', createTestProfile());

      expect(() => user.validate()).toThrow('Email is required');
    });

    it('should throw error when following count exceeds maximum', () => {
      const user = createTestUser();
      user.setFollowingAndFollowers(
        Array.from({ length: 10001 }, (_, i) => `user-${i}`),
        [],
      );

      expect(() => user.validate()).toThrow(
        'Following count exceeds maximum limit',
      );
    });

    it('should not throw when user is valid', () => {
      const user = createTestUser();

      expect(() => user.validate()).not.toThrow();
    });
  });
});
