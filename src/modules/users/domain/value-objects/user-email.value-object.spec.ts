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

  describe('edge cases and internationalization', () => {
    it('should handle plus addressing (gmail style)', () => {
      const email = UserEmail.create('user+test@example.com');
      expect(email.getValue()).toBe('user+test@example.com');
      expect(email.getLocalPart()).toBe('user+test');
    });

    it('should handle subdomain emails', () => {
      const email = UserEmail.create('user@mail.example.com');
      expect(email.getValue()).toBe('user@mail.example.com');
      expect(email.getDomain()).toBe('mail.example.com');
    });

    it('should handle country-code TLDs', () => {
      const validEmails = [
        'user@example.co.uk',
        'user@example.com.au',
        'user@example.fr',
      ];
      validEmails.forEach((email) => {
        expect(() => UserEmail.create(email)).not.toThrow();
      });
    });

    it('should handle new gTLDs', () => {
      const validEmails = [
        'user@example.tech',
        'user@example.dev',
        'user@example.app',
      ];
      validEmails.forEach((email) => {
        expect(() => UserEmail.create(email)).not.toThrow();
      });
    });

    it('should reject email with consecutive dots in local part', () => {
      expect(() => UserEmail.create('user..name@example.com')).toThrow(
        ValidationException,
      );
    });

    it('should reject email with leading dot in local part', () => {
      expect(() => UserEmail.create('.user@example.com')).toThrow(
        ValidationException,
      );
    });

    it('should reject email with trailing dot in local part', () => {
      expect(() => UserEmail.create('user.@example.com')).toThrow(
        ValidationException,
      );
    });

    it('should reject email without TLD', () => {
      expect(() => UserEmail.create('user@localhost')).toThrow(
        ValidationException,
      );
    });

    it('should reject email with spaces', () => {
      expect(() => UserEmail.create('user name@example.com')).toThrow(
        ValidationException,
      );
      expect(() => UserEmail.create('user@example .com')).toThrow(
        ValidationException,
      );
    });

    it('should handle very long local parts', () => {
      const longLocal = 'a'.repeat(64); // Max local part is 64 chars
      const email = UserEmail.create(`${longLocal}@example.com`);
      expect(email.getLocalPart()).toBe(longLocal);
    });

    it('should reject email exceeding 255 total characters', () => {
      const longLocal = 'a'.repeat(200);
      const longDomain = 'b'.repeat(60) + '.com';
      expect(() => UserEmail.create(`${longLocal}@${longDomain}`)).toThrow(
        ValidationException,
      );
    });

    it('should handle email normalization consistently', () => {
      const email1 = UserEmail.create('  TEST@EXAMPLE.COM  ');
      const email2 = UserEmail.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
      expect(email1.getValue()).toBe('test@example.com');
    });

    it('should reject null or undefined', () => {
      expect(() => UserEmail.create(null as any)).toThrow(ValidationException);
      expect(() => UserEmail.create(undefined as any)).toThrow(
        ValidationException,
      );
    });

    it('should handle underscore in local part', () => {
      const email = UserEmail.create('user_name@example.com');
      expect(email.getLocalPart()).toBe('user_name');
    });

    it('should handle hyphen in domain', () => {
      const email = UserEmail.create('user@my-domain.com');
      expect(email.getDomain()).toBe('my-domain.com');
    });

    it('should reject email with multiple @ symbols', () => {
      expect(() => UserEmail.create('user@@example.com')).toThrow(
        ValidationException,
      );
      expect(() => UserEmail.create('user@domain@example.com')).toThrow(
        ValidationException,
      );
    });

    it('should reject email with special chars in domain', () => {
      expect(() => UserEmail.create('user@exam ple.com')).toThrow(
        ValidationException,
      );
      expect(() => UserEmail.create('user@exam_ple.com')).toThrow(
        ValidationException,
      );
    });
  });
});
