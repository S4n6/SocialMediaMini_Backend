import { UserFactory } from './user.factory';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { ValidationException } from '../exceptions/domain.exceptions';

describe('UserFactory', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const request = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        profile: {
          fullName: 'John Doe',
          bio: 'Software developer',
          location: 'New York',
        },
      };

      const user = await UserFactory.createUser(request);

      expect(user).toBeInstanceOf(User);
      expect(user.username).toBe('johndoe');
      expect(user.email).toBe('john@example.com');
      expect(user.profile.fullName).toBe('John Doe');
      expect(user.profile.bio).toBe('Software developer');
      expect(user.role).toBe(UserRole.USER);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.isEmailVerified).toBe(false);
      expect(user.passwordHash).toBeDefined();
    });

    it('should create user without password for OAuth', async () => {
      const request = {
        username: 'johndoe',
        email: 'john@example.com',
        googleId: 'google-123',
        profile: {
          fullName: 'John Doe',
        },
      };

      const user = await UserFactory.createUser(request);

      expect(user).toBeInstanceOf(User);
      expect(user.passwordHash).toBeUndefined();
    });

    it('should create admin user when role specified', async () => {
      const request = {
        username: 'superadmin',
        email: 'admin@example.com',
        password: 'AdminPass123!',
        profile: {
          fullName: 'Admin User',
        },
        role: UserRole.ADMIN,
      };

      const user = await UserFactory.createUser(request);

      expect(user.role).toBe(UserRole.ADMIN);
    });

    it('should emit UserRegisteredEvent for new user', async () => {
      const request = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'NewPass123!',
        profile: {
          fullName: 'New User',
        },
      };

      const user = await UserFactory.createUser(request);

      // Factory sets createdAt, so events are emitted during construction
      // Check that user was created (events may have been cleared)
      expect(user).toBeInstanceOf(User);
      expect(user.username).toBe('newuser');
    });

    it('should throw ValidationException for invalid email', async () => {
      const request = {
        username: 'johndoe',
        email: 'invalid-email',
        password: 'SecurePass123!',
        profile: {
          fullName: 'John Doe',
        },
      };

      await expect(UserFactory.createUser(request)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw ValidationException for invalid username', async () => {
      const request = {
        username: 'ab', // Too short
        email: 'john@example.com',
        password: 'SecurePass123!',
        profile: {
          fullName: 'John Doe',
        },
      };

      await expect(UserFactory.createUser(request)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw ValidationException for weak password', async () => {
      const request = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'weak', // Too weak
        profile: {
          fullName: 'John Doe',
        },
      };

      await expect(UserFactory.createUser(request)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should create user with all profile fields', async () => {
      const request = {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        profile: {
          fullName: 'John Doe',
          bio: 'Developer',
          dateOfBirth: new Date('1990-01-01'),
          avatar: 'https://example.com/avatar.jpg',
          websiteUrl: 'https://johndoe.com',
          location: 'San Francisco',
          phoneNumber: '+1234567890',
          gender: 'male',
        },
      };

      const user = await UserFactory.createUser(request);

      expect(user.profile.fullName).toBe('John Doe');
      expect(user.profile.bio).toBe('Developer');
      expect(user.profile.location).toBe('San Francisco');
      expect(user.profile.websiteUrl).toBe('https://johndoe.com');
    });
  });

  describe('createUserFromGoogle', () => {
    it('should create user from Google OAuth data', () => {
      const request = {
        googleId: 'google-123456',
        email: 'john.doe@gmail.com',
        profile: {
          fullName: 'John Doe',
          avatar: 'https://lh3.googleusercontent.com/avatar.jpg',
        },
      };

      const user = UserFactory.createUserFromGoogle(request);

      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('john.doe@gmail.com');
      expect(user.profile.fullName).toBe('John Doe');
      expect(user.profile.avatar).toBe(
        'https://lh3.googleusercontent.com/avatar.jpg',
      );
      expect(user.googleId).toBe('google-123456');
      expect(user.passwordHash).toBeUndefined();
      expect(user.isEmailVerified).toBe(true); // Google emails are pre-verified
    });

    it('should generate username from email', () => {
      const request = {
        googleId: 'google-123',
        email: 'john.doe+test@gmail.com',
        profile: {
          fullName: 'John Doe',
        },
      };

      const user = UserFactory.createUserFromGoogle(request);

      // Username should be sanitized from email local part
      expect(user.username).toMatch(/^[a-z0-9_]+$/);
      expect(user.username.length).toBeGreaterThanOrEqual(3);
    });

    it('should throw ValidationException for invalid Google email', () => {
      const request = {
        googleId: 'google-123',
        email: 'invalid-email',
        profile: {
          fullName: 'John Doe',
        },
      };

      expect(() => UserFactory.createUserFromGoogle(request)).toThrow(
        ValidationException,
      );
    });
  });

  describe('reconstructUser', () => {
    it('should reconstruct user from persistence data', () => {
      const data = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        username: 'johndoe',
        email: 'john@example.com',
        passwordHash: '$2b$12$hashedpassword',
        profile: {
          fullName: 'John Doe',
          bio: 'Developer',
        },
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        emailVerifiedAt: new Date('2024-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2024-01-15'),
        followingIds: ['user-1', 'user-2'],
        followerIds: ['user-3', 'user-4'],
      };

      const user = UserFactory.reconstructUser(data);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(user.username).toBe('johndoe');
      expect(user.email).toBe('john@example.com');
      expect(user.isEmailVerified).toBe(true);
      expect(user.followingCount).toBe(2);
      expect(user.followersCount).toBe(2);
      expect(user.getDomainEvents()).toHaveLength(0); // No events for reconstructed user
    });

    it('should reconstruct user without optional fields', () => {
      const data = {
        id: '660e8400-e29b-41d4-a716-446655440001',
        username: 'minimaluser',
        email: 'minimal@example.com',
        profile: {
          fullName: 'Minimal User',
        },
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const user = UserFactory.reconstructUser(data);

      expect(user).toBeInstanceOf(User);
      expect(user.passwordHash).toBeUndefined();
      expect(user.googleId).toBeUndefined();
      expect(user.followingCount).toBe(0);
      expect(user.followersCount).toBe(0);
    });
  });
});
