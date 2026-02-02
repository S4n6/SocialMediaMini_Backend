import { Username } from './username.value-object';
import { ValidationException } from '../exceptions/domain.exceptions';

describe('Username Value Object', () => {
  describe('creation and validation', () => {
    it('should create valid username', () => {
      const username = Username.create('johndoe');
      expect(username.getValue()).toBe('johndoe');
    });

    it('should normalize to lowercase', () => {
      const username = Username.create('JohnDoe');
      expect(username.getValue()).toBe('johndoe');
    });

    it('should trim whitespace', () => {
      const username = Username.create('  johndoe  ');
      expect(username.getValue()).toBe('johndoe');
    });

    it('should throw ValidationException for empty username', () => {
      expect(() => Username.create('')).toThrow(ValidationException);
      expect(() => Username.create('   ')).toThrow(ValidationException);
    });

    it('should throw ValidationException for username too short', () => {
      expect(() => Username.create('ab')).toThrow(ValidationException);
    });

    it('should throw ValidationException for username too long', () => {
      const longUsername = 'a'.repeat(31);
      expect(() => Username.create(longUsername)).toThrow(ValidationException);
    });

    it('should accept username with minimum length', () => {
      expect(() => Username.create('abc')).not.toThrow();
    });

    it('should accept username with maximum length', () => {
      const maxUsername = 'a'.repeat(30);
      expect(() => Username.create(maxUsername)).not.toThrow();
    });

    it('should throw ValidationException for invalid characters', () => {
      expect(() => Username.create('user@name')).toThrow(ValidationException);
      expect(() => Username.create('user name')).toThrow(ValidationException);
      expect(() => Username.create('user#name')).toThrow(ValidationException);
      expect(() => Username.create('user!name')).toThrow(ValidationException);
    });

    it('should accept valid usernames with alphanumeric and underscores', () => {
      const validUsernames = [
        'john_doe',
        'user123',
        'test_user_2024',
        'johndoe123',
      ];

      validUsernames.forEach((username) => {
        expect(() => Username.create(username)).not.toThrow();
      });
    });

    it('should throw ValidationException for username starting/ending with underscore', () => {
      expect(() => Username.create('_username')).toThrow(ValidationException);
      expect(() => Username.create('username_')).toThrow(ValidationException);
    });
  });

  describe('equality', () => {
    it('should be equal when usernames are the same', () => {
      const username1 = Username.create('johndoe');
      const username2 = Username.create('johndoe');
      expect(username1.equals(username2)).toBe(true);
    });

    it('should be equal regardless of case', () => {
      const username1 = Username.create('JOHNDOE');
      const username2 = Username.create('johndoe');
      expect(username1.equals(username2)).toBe(true);
    });

    it('should not be equal when usernames differ', () => {
      const username1 = Username.create('johndoe');
      const username2 = Username.create('janedoe');
      expect(username1.equals(username2)).toBe(false);
    });
  });

  describe('edge cases and reserved names', () => {
    it('should accept username with consecutive underscores', () => {
      expect(() => Username.create('user__name')).not.toThrow();
    });

    it('should accept username with multiple underscores', () => {
      expect(() => Username.create('user_test_name')).not.toThrow();
    });

    it('should accept username with all numbers (but valid format)', () => {
      expect(() => Username.create('123456')).not.toThrow();
    });

    it('should accept username with hyphen', () => {
      expect(() => Username.create('user-name')).not.toThrow();
    });

    it('should accept username with dots', () => {
      expect(() => Username.create('user.name')).not.toThrow();
    });

    it('should handle mixed case during creation', () => {
      const username = Username.create('JohnDoe123');
      expect(username.getValue()).toBe('johndoe123');
    });

    it('should handle whitespace at boundaries', () => {
      const username = Username.create('  johndoe  ');
      expect(username.getValue()).toBe('johndoe');
    });

    it('should reject username with leading/trailing underscores after trim', () => {
      expect(() => Username.create('  _johndoe  ')).toThrow(
        ValidationException,
      );
      expect(() => Username.create('  johndoe_  ')).toThrow(
        ValidationException,
      );
    });

    it('should accept exactly 3 characters (minimum)', () => {
      const username = Username.create('abc');
      expect(username.getValue()).toBe('abc');
    });

    it('should accept exactly 30 characters (maximum)', () => {
      const maxUsername = 'a'.repeat(30);
      const username = Username.create(maxUsername);
      expect(username.getValue()).toBe(maxUsername);
    });

    it('should reject 2 characters (below minimum)', () => {
      expect(() => Username.create('ab')).toThrow(ValidationException);
    });

    it('should reject 31 characters (above maximum)', () => {
      const tooLong = 'a'.repeat(31);
      expect(() => Username.create(tooLong)).toThrow(ValidationException);
    });

    it('should handle null or undefined', () => {
      expect(() => Username.create(null as any)).toThrow(ValidationException);
      expect(() => Username.create(undefined as any)).toThrow(
        ValidationException,
      );
    });

    it('should reject username with only underscores', () => {
      expect(() => Username.create('___')).toThrow(ValidationException);
    });

    it('should reject username with tab characters', () => {
      expect(() => Username.create('user\tname')).toThrow(ValidationException);
    });

    it('should reject username with newlines', () => {
      expect(() => Username.create('user\nname')).toThrow(ValidationException);
    });

    it('should accept alphanumeric with underscores at any position (except start/end)', () => {
      const validUsernames = [
        'a_b_c',
        'test_123',
        '123_test',
        'user_2024_test',
      ];
      validUsernames.forEach((username) => {
        expect(() => Username.create(username)).not.toThrow();
      });
    });
  });
});
