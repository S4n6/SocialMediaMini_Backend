import { User, UserRole } from './user.entity';
import { Email } from '../value-objects/email.vo';

describe('User Entity', () => {
  // Test data factory
  const createValidUserProps = (overrides: any = {}) => ({
    id: 'user-123',
    email: new Email('john@example.com'),
    username: 'johnsmith',
    fullName: 'John Smith',
    hashedPassword: '$2a$10$' + 'A'.repeat(53), // Valid 60-char bcrypt hash
    role: UserRole.USER,
    ...overrides,
  });

  const createValidPersistenceProps = (overrides: any = {}) => ({
    id: 'user-123',
    email: new Email('john@example.com'),
    username: 'johnsmith',
    fullName: 'John Smith',
    hashedPassword: '$2a$10$' + 'B'.repeat(53), // Valid 60-char bcrypt hash
    role: UserRole.USER,
    isEmailVerified: false,
    emailVerifiedAt: null,
    avatar: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    lastLoginAt: null,
    ...overrides,
  });

  describe('User Creation - Static Factory Methods', () => {
    describe('User.create()', () => {
      it('should create new user with required properties', () => {
        const props = createValidUserProps();
        const user = User.create(props);

        expect(user.id).toBe(props.id);
        expect(user.email).toBe(props.email);
        expect(user.username).toBe(props.username);
        expect(user.fullName).toBe(props.fullName);
        expect(user.hashedPassword).toBe(props.hashedPassword);
        expect(user.role).toBe(UserRole.USER);
        expect(user.isEmailVerified).toBe(false);
        expect(user.emailVerifiedAt).toBeNull();
        expect(user.avatar).toBeNull();
        expect(user.lastLoginAt).toBeNull();
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
      });

      it('should create user with optional role', () => {
        const props = createValidUserProps({ role: UserRole.ADMIN });
        const user = User.create(props);

        expect(user.role).toBe(UserRole.ADMIN);
      });

      it('should create user with optional avatar', () => {
        const props = createValidUserProps({ avatar: 'avatar-url' });
        const user = User.create(props);

        expect(user.avatar).toBe('avatar-url');
      });

      it('should default to USER role when not specified', () => {
        const props = createValidUserProps();
        delete props.role;
        const user = User.create(props);

        expect(user.role).toBe(UserRole.USER);
      });

      it('should set timestamps for new user', () => {
        const before = new Date();
        const user = User.create(createValidUserProps());
        const after = new Date();

        expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(user.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      });
    });

    describe('User.fromPersistence()', () => {
      it('should reconstruct user from persistence data', () => {
        const props = createValidPersistenceProps();
        const user = User.fromPersistence(props);

        expect(user.id).toBe(props.id);
        expect(user.email).toBe(props.email);
        expect(user.username).toBe(props.username);
        expect(user.fullName).toBe(props.fullName);
        expect(user.hashedPassword).toBe(props.hashedPassword);
        expect(user.role).toBe(props.role);
        expect(user.isEmailVerified).toBe(props.isEmailVerified);
        expect(user.emailVerifiedAt).toBe(props.emailVerifiedAt);
        expect(user.avatar).toBe(props.avatar);
        expect(user.createdAt).toBe(props.createdAt);
        expect(user.updatedAt).toBe(props.updatedAt);
        expect(user.lastLoginAt).toBe(props.lastLoginAt);
      });

      it('should reconstruct verified user', () => {
        const verifiedAt = new Date('2026-01-15');
        const props = createValidPersistenceProps({
          isEmailVerified: true,
          emailVerifiedAt: verifiedAt,
        });
        const user = User.fromPersistence(props);

        expect(user.isEmailVerified).toBe(true);
        expect(user.emailVerifiedAt).toBe(verifiedAt);
      });

      it('should reconstruct user with login history', () => {
        const lastLogin = new Date('2026-01-20');
        const props = createValidPersistenceProps({
          lastLoginAt: lastLogin,
        });
        const user = User.fromPersistence(props);

        expect(user.lastLoginAt).toBe(lastLogin);
      });
    });
  });

  describe('User Business Logic - Email Verification', () => {
    describe('verifyEmail()', () => {
      it('should verify unverified user email', () => {
        const originalUser = User.create(createValidUserProps());
        expect(originalUser.isEmailVerified).toBe(false);

        const before = new Date();
        const verifiedUser = originalUser.verifyEmail();
        const after = new Date();

        expect(verifiedUser.isEmailVerified).toBe(true);
        expect(verifiedUser.emailVerifiedAt).toBeInstanceOf(Date);
        expect(verifiedUser.emailVerifiedAt!.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(verifiedUser.emailVerifiedAt!.getTime()).toBeLessThanOrEqual(
          after.getTime(),
        );
        expect(verifiedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );

        // Original should be unchanged (immutability)
        expect(originalUser.isEmailVerified).toBe(false);
        expect(originalUser.emailVerifiedAt).toBeNull();
      });

      it('should throw error when email is already verified', () => {
        const verifiedUser = User.fromPersistence(
          createValidPersistenceProps({
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          }),
        );

        expect(() => verifiedUser.verifyEmail()).toThrow(
          'Email is already verified',
        );
      });

      it('should maintain other properties when verifying', () => {
        const originalUser = User.create(createValidUserProps());
        const verifiedUser = originalUser.verifyEmail();

        expect(verifiedUser.id).toBe(originalUser.id);
        expect(verifiedUser.email).toBe(originalUser.email);
        expect(verifiedUser.username).toBe(originalUser.username);
        expect(verifiedUser.fullName).toBe(originalUser.fullName);
        expect(verifiedUser.hashedPassword).toBe(originalUser.hashedPassword);
        expect(verifiedUser.role).toBe(originalUser.role);
        expect(verifiedUser.avatar).toBe(originalUser.avatar);
        expect(verifiedUser.createdAt).toBe(originalUser.createdAt);
        expect(verifiedUser.lastLoginAt).toBe(originalUser.lastLoginAt);
      });
    });
  });

  describe('User Business Logic - Login Tracking', () => {
    describe('updateLastLogin()', () => {
      it('should update last login timestamp for new user', () => {
        const originalUser = User.create(createValidUserProps());
        expect(originalUser.lastLoginAt).toBeNull();

        const before = new Date();
        const loggedInUser = originalUser.updateLastLogin();
        const after = new Date();

        expect(loggedInUser.lastLoginAt).toBeInstanceOf(Date);
        expect(loggedInUser.lastLoginAt!.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(loggedInUser.lastLoginAt!.getTime()).toBeLessThanOrEqual(
          after.getTime(),
        );
        expect(loggedInUser.updatedAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );

        // Original should be unchanged (immutability)
        expect(originalUser.lastLoginAt).toBeNull();
      });

      it('should update last login timestamp for returning user', () => {
        const oldLoginTime = new Date('2026-01-01');
        const originalUser = User.fromPersistence(
          createValidPersistenceProps({
            lastLoginAt: oldLoginTime,
            updatedAt: oldLoginTime,
          }),
        );

        const before = new Date();
        const loggedInUser = originalUser.updateLastLogin();

        expect(loggedInUser.lastLoginAt!.getTime()).toBeGreaterThan(
          oldLoginTime.getTime(),
        );
        expect(loggedInUser.updatedAt.getTime()).toBeGreaterThan(
          oldLoginTime.getTime(),
        );
      });

      it('should maintain other properties when updating login', () => {
        const originalUser = User.create(createValidUserProps());
        const loggedInUser = originalUser.updateLastLogin();

        expect(loggedInUser.id).toBe(originalUser.id);
        expect(loggedInUser.email).toBe(originalUser.email);
        expect(loggedInUser.username).toBe(originalUser.username);
        expect(loggedInUser.fullName).toBe(originalUser.fullName);
        expect(loggedInUser.hashedPassword).toBe(originalUser.hashedPassword);
        expect(loggedInUser.role).toBe(originalUser.role);
        expect(loggedInUser.isEmailVerified).toBe(originalUser.isEmailVerified);
        expect(loggedInUser.emailVerifiedAt).toBe(originalUser.emailVerifiedAt);
        expect(loggedInUser.avatar).toBe(originalUser.avatar);
        expect(loggedInUser.createdAt).toBe(originalUser.createdAt);
      });
    });
  });

  describe('User Business Logic - Password Management', () => {
    describe('changePassword()', () => {
      it('should change password with valid hash', () => {
        const originalUser = User.create(createValidUserProps());
        const newHashedPassword = '$2a$10$' + 'N'.repeat(53); // Valid 60-char bcrypt

        const before = new Date();
        const updatedUser = originalUser.changePassword(newHashedPassword);

        expect(updatedUser.hashedPassword).toBe(newHashedPassword);
        expect(updatedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );

        // Original should be unchanged (immutability)
        expect(originalUser.hashedPassword).not.toBe(newHashedPassword);
      });

      it('should throw error when hashed password is empty', () => {
        const user = User.create(createValidUserProps());

        expect(() => user.changePassword('')).toThrow(
          'Hashed password is required',
        );
      });

      it('should throw error when hashed password is null', () => {
        const user = User.create(createValidUserProps());

        expect(() => user.changePassword(null as any)).toThrow(
          'Hashed password is required',
        );
      });

      it('should throw error when hashed password is too short', () => {
        const user = User.create(createValidUserProps());

        expect(() => user.changePassword('short')).toThrow(
          'Invalid password hash - must be a valid bcrypt hash',
        );
      });

      it('should throw error when password is not a valid bcrypt hash', () => {
        const user = User.create(createValidUserProps());

        // Test invalid bcrypt hashes (not matching bcrypt format)
        expect(() =>
          user.changePassword('invalid_hash_not_bcrypt_format_here'),
        ).toThrow('Invalid password hash - must be a valid bcrypt hash');

        expect(() =>
          user.changePassword(
            'plaintext_password_that_is_long_enough_but_not_hashed',
          ),
        ).toThrow('Invalid password hash - must be a valid bcrypt hash');
      });

      it('should accept valid bcrypt hash formats', () => {
        const user = User.create(createValidUserProps());

        // Valid bcrypt $2a$ format (60 characters total: $2a$10$ + 53 chars)
        const bcrypt2a = '$2a$10$' + 'a'.repeat(53);
        expect(() => user.changePassword(bcrypt2a)).not.toThrow();

        // Valid bcrypt $2b$ format (60 characters total)
        const bcrypt2b = '$2b$12$' + 'a'.repeat(53); // $2b$12$ + 53 chars = 60 total
        const user2 = User.create(createValidUserProps());
        expect(() => user2.changePassword(bcrypt2b)).not.toThrow();

        // Valid bcrypt $2y$ format (60 characters total)
        const bcrypt2y = '$2y$10$' + 'x'.repeat(53); // $2y$10$ + 53 chars = 60 total
        const user3 = User.create(createValidUserProps());
        expect(() => user3.changePassword(bcrypt2y)).not.toThrow();
      });

      it('should maintain other properties when changing password', () => {
        const originalUser = User.create(createValidUserProps());
        const newHashedPassword = '$2b$12$' + 'X'.repeat(53); // Valid 60-char bcrypt
        const updatedUser = originalUser.changePassword(newHashedPassword);

        expect(updatedUser.id).toBe(originalUser.id);
        expect(updatedUser.email).toBe(originalUser.email);
        expect(updatedUser.username).toBe(originalUser.username);
        expect(updatedUser.fullName).toBe(originalUser.fullName);
        expect(updatedUser.role).toBe(originalUser.role);
        expect(updatedUser.isEmailVerified).toBe(originalUser.isEmailVerified);
        expect(updatedUser.emailVerifiedAt).toBe(originalUser.emailVerifiedAt);
        expect(updatedUser.avatar).toBe(originalUser.avatar);
        expect(updatedUser.createdAt).toBe(originalUser.createdAt);
        expect(updatedUser.lastLoginAt).toBe(originalUser.lastLoginAt);
      });
    });
  });

  describe('User Business Logic - Profile Management', () => {
    describe('updateProfile()', () => {
      it('should update username only', () => {
        const originalUser = User.create(createValidUserProps());
        const updatedUser = originalUser.updateProfile({
          username: 'newusername',
        });

        expect(updatedUser.username).toBe('newusername');
        expect(updatedUser.fullName).toBe(originalUser.fullName);
        expect(updatedUser.avatar).toBe(originalUser.avatar);
      });

      it('should update full name only', () => {
        const originalUser = User.create(createValidUserProps());
        const updatedUser = originalUser.updateProfile({
          fullName: 'Jane Doe',
        });

        expect(updatedUser.fullName).toBe('Jane Doe');
        expect(updatedUser.username).toBe(originalUser.username);
        expect(updatedUser.avatar).toBe(originalUser.avatar);
      });

      it('should update avatar only', () => {
        const originalUser = User.create(createValidUserProps());
        const updatedUser = originalUser.updateProfile({
          avatar: 'new-avatar-url',
        });

        expect(updatedUser.avatar).toBe('new-avatar-url');
        expect(updatedUser.username).toBe(originalUser.username);
        expect(updatedUser.fullName).toBe(originalUser.fullName);
      });

      it('should update multiple properties at once', () => {
        const originalUser = User.create(createValidUserProps());
        const updatedUser = originalUser.updateProfile({
          username: 'newuser',
          fullName: 'New Full Name',
          avatar: 'new-avatar',
        });

        expect(updatedUser.username).toBe('newuser');
        expect(updatedUser.fullName).toBe('New Full Name');
        expect(updatedUser.avatar).toBe('new-avatar');
      });

      it('should handle avatar removal (set to undefined)', () => {
        const originalUser = User.create(
          createValidUserProps({ avatar: 'existing-avatar' }),
        );
        const updatedUser = originalUser.updateProfile({ avatar: undefined });

        expect(updatedUser.avatar).toBe('existing-avatar'); // Undefined keeps existing value
      });

      it('should update updatedAt timestamp', () => {
        const originalUser = User.create(createValidUserProps());
        // Add small delay to ensure different timestamps
        setTimeout(() => {}, 1);
        const before = new Date();
        const updatedUser = originalUser.updateProfile({
          username: 'newuser',
        });

        expect(updatedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(
          before.getTime(),
        );
        expect(updatedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(
          originalUser.updatedAt.getTime(),
        );
      });
    });
  });

  describe('User Business Logic - Utility Methods', () => {
    describe('canLogin()', () => {
      it('should return true for verified user', () => {
        const user = User.fromPersistence(
          createValidPersistenceProps({
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          }),
        );

        expect(user.canLogin()).toBe(true);
      });

      it('should return false for unverified user', () => {
        const user = User.create(createValidUserProps());

        expect(user.canLogin()).toBe(false);
      });
    });

    describe('getAccountAge()', () => {
      it('should return account age in days', () => {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - 30); // 30 days ago

        const user = User.fromPersistence(
          createValidPersistenceProps({ createdAt }),
        );

        expect(user.getAccountAge()).toBe(30);
      });

      it('should return 0 for brand new account', () => {
        const user = User.create(createValidUserProps());

        expect(user.getAccountAge()).toBe(0);
      });

      it('should handle fractional days (round down)', () => {
        const createdAt = new Date();
        createdAt.setHours(createdAt.getHours() - 25); // 25 hours ago (1.04 days)

        const user = User.fromPersistence(
          createValidPersistenceProps({ createdAt }),
        );

        expect(user.getAccountAge()).toBe(1);
      });
    });
  });

  describe('User Validation - Invariants', () => {
    describe('Invariant Validation', () => {
      it('should throw error when user ID is missing', () => {
        expect(() =>
          User.fromPersistence(createValidPersistenceProps({ id: '' })),
        ).toThrow('User ID is required');
      });

      it('should throw error when username is too short', () => {
        expect(() =>
          User.fromPersistence(createValidPersistenceProps({ username: 'ab' })),
        ).toThrow('Username must be at least 3 characters long');
      });

      it('should throw error when username is only whitespace', () => {
        expect(() =>
          User.fromPersistence(
            createValidPersistenceProps({ username: '   ' }),
          ),
        ).toThrow('Username must be at least 3 characters long');
      });

      it('should throw error when full name is too short', () => {
        expect(() =>
          User.fromPersistence(createValidPersistenceProps({ fullName: 'A' })),
        ).toThrow('Full name must be at least 2 characters long');
      });

      it('should throw error when full name is only whitespace', () => {
        expect(() =>
          User.fromPersistence(createValidPersistenceProps({ fullName: '  ' })),
        ).toThrow('Full name must be at least 2 characters long');
      });

      it('should throw error when hashed password is missing', () => {
        expect(() =>
          User.fromPersistence(
            createValidPersistenceProps({ hashedPassword: '' }),
          ),
        ).toThrow('Hashed password is required');
      });

      it('should throw error when role is invalid', () => {
        expect(() =>
          User.fromPersistence(
            createValidPersistenceProps({ role: 'INVALID_ROLE' as any }),
          ),
        ).toThrow('Invalid user role');
      });

      it('should accept valid USER role', () => {
        expect(() =>
          User.fromPersistence(
            createValidPersistenceProps({ role: UserRole.USER }),
          ),
        ).not.toThrow();
      });

      it('should accept valid ADMIN role', () => {
        expect(() =>
          User.fromPersistence(
            createValidPersistenceProps({ role: UserRole.ADMIN }),
          ),
        ).not.toThrow();
      });

      it('should accept valid MODERATOR role', () => {
        expect(() =>
          User.fromPersistence(
            createValidPersistenceProps({ role: UserRole.MODERATOR }),
          ),
        ).not.toThrow();
      });
    });
  });

  describe('User Serialization', () => {
    describe('toPlainObject()', () => {
      it('should convert to plain object with all properties', () => {
        const user = User.fromPersistence(
          createValidPersistenceProps({
            isEmailVerified: true,
            emailVerifiedAt: new Date('2026-01-15'),
            lastLoginAt: new Date('2026-01-20'),
            avatar: 'avatar-url',
          }),
        );

        const plainObject = user.toPlainObject();

        expect(plainObject).toEqual({
          id: user.id,
          email: user.email.value, // Email VO serialized to string
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          emailVerifiedAt: user.emailVerifiedAt,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
        });
      });

      it('should handle null values correctly', () => {
        const user = User.create(createValidUserProps());
        const plainObject = user.toPlainObject();

        expect(plainObject.emailVerifiedAt).toBeNull();
        expect(plainObject.lastLoginAt).toBeNull();
        expect(plainObject.avatar).toBeNull();
      });
    });
  });

  describe('User Immutability', () => {
    it('should not modify original user when calling verifyEmail', () => {
      const originalUser = User.create(createValidUserProps());
      const originalVerified = originalUser.isEmailVerified;
      const originalEmailVerifiedAt = originalUser.emailVerifiedAt;

      originalUser.verifyEmail();

      expect(originalUser.isEmailVerified).toBe(originalVerified);
      expect(originalUser.emailVerifiedAt).toBe(originalEmailVerifiedAt);
    });

    it('should not modify original user when calling updateLastLogin', () => {
      const originalUser = User.create(createValidUserProps());
      const originalLastLogin = originalUser.lastLoginAt;

      originalUser.updateLastLogin();

      expect(originalUser.lastLoginAt).toBe(originalLastLogin);
    });

    it('should not modify original user when calling changePassword', () => {
      const originalUser = User.create(createValidUserProps());
      const originalPassword = originalUser.hashedPassword;

      originalUser.changePassword('$2b$12$' + 'X'.repeat(53));

      expect(originalUser.hashedPassword).toBe(originalPassword);
    });

    it('should not modify original user when calling updateProfile', () => {
      const originalUser = User.create(createValidUserProps());
      const originalUsername = originalUser.username;

      originalUser.updateProfile({ username: 'newusername' });

      expect(originalUser.username).toBe(originalUsername);
    });
  });
});
