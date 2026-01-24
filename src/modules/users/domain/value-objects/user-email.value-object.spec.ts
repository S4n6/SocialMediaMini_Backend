import { UserEmail } from './user-email.value-object';
import { ValidationException } from '../exceptions/domain.exceptions';

describe('UserEmail Value Object', () => {
  describe('creation and validation', () => {
    it('should create valid email', () => {
      const email = UserEmail.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = UserEmail.create('TEST@EXAMPLE.COM');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = UserEmail.create('  test@example.com  ');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw ValidationException for empty email', () => {
      expect(() => UserEmail.create('')).toThrow(ValidationException);
      expect(() => UserEmail.create('   ')).toThrow(ValidationException);
    });

    it('should throw ValidationException for invalid format', () => {
      expect(() => UserEmail.create('invalid')).toThrow(ValidationException);
      expect(() => UserEmail.create('invalid@')).toThrow(ValidationException);
      expect(() => UserEmail.create('@example.com')).toThrow(
        ValidationException,
      );
      expect(() => UserEmail.create('test@')).toThrow(ValidationException);
      expect(() => UserEmail.create('test@.com')).toThrow(ValidationException);
    });

    it('should throw ValidationException for email exceeding 255 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => UserEmail.create(longEmail)).toThrow(ValidationException);
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'user123@example456.org',
      ];

      validEmails.forEach((email) => {
        expect(() => UserEmail.create(email)).not.toThrow();
      });
    });
  });

  describe('utility methods', () => {
    it('should extract domain correctly', () => {
      const email = UserEmail.create('test@example.com');
      expect(email.getDomain()).toBe('example.com');
    });

    it('should extract local part correctly', () => {
      const email = UserEmail.create('test@example.com');
      expect(email.getLocalPart()).toBe('test');
    });
  });

  describe('equality', () => {
    it('should be equal when emails are the same', () => {
      const email1 = UserEmail.create('test@example.com');
      const email2 = UserEmail.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should be equal regardless of case', () => {
      const email1 = UserEmail.create('TEST@EXAMPLE.COM');
      const email2 = UserEmail.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should not be equal when emails differ', () => {
      const email1 = UserEmail.create('test1@example.com');
      const email2 = UserEmail.create('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
