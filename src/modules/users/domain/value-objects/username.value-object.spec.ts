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
});
