import { Email } from './email.vo';

describe('Email Value Object', () => {
  describe('Valid Email Creation', () => {
    it('should create email with standard format', () => {
      const email = new Email('user@example.com');

      expect(email.value).toBe('user@example.com');
    });

    it('should create email with subdomain', () => {
      const email = new Email('user@mail.example.com');

      expect(email.value).toBe('user@mail.example.com');
    });

    it('should create email with numbers', () => {
      const email = new Email('user123@example.com');

      expect(email.value).toBe('user123@example.com');
    });

    it('should create email with dots in local part', () => {
      const email = new Email('first.last@example.com');

      expect(email.value).toBe('first.last@example.com');
    });

    it('should create email with plus sign', () => {
      const email = new Email('user+tag@example.com');

      expect(email.value).toBe('user+tag@example.com');
    });

    it('should create email with hyphen in domain', () => {
      const email = new Email('user@my-company.com');

      expect(email.value).toBe('user@my-company.com');
    });

    it('should convert email to lowercase', () => {
      const email = new Email('User@Example.COM');

      expect(email.value).toBe('user@example.com');
    });
  });

  describe('Email Validation - Required Field', () => {
    it('should throw error when email is empty string', () => {
      expect(() => new Email('')).toThrow('Email is required');
    });

    it('should throw error when email is null', () => {
      expect(() => new Email(null as any)).toThrow('Email is required');
    });

    it('should throw error when email is undefined', () => {
      expect(() => new Email(undefined as any)).toThrow('Email is required');
    });

    it('should throw error when email is only whitespace', () => {
      // Whitespace fails the regex validation (contains \s)
      expect(() => new Email('   ')).toThrow('Invalid email format');
    });
  });

  describe('Email Validation - Format Requirements', () => {
    it('should throw error when email has no @ symbol', () => {
      expect(() => new Email('userexample.com')).toThrow(
        'Invalid email format',
      );
    });

    it('should throw error when email has multiple @ symbols', () => {
      expect(() => new Email('user@@example.com')).toThrow(
        'Invalid email format',
      );
    });

    it('should throw error when email has no domain', () => {
      expect(() => new Email('user@')).toThrow('Invalid email format');
    });

    it('should throw error when email has no local part', () => {
      expect(() => new Email('@example.com')).toThrow('Invalid email format');
    });

    it('should throw error when email has no TLD', () => {
      expect(() => new Email('user@example')).toThrow('Invalid email format');
    });

    it('should throw error when email has spaces in middle', () => {
      expect(() => new Email('user name@example.com')).toThrow(
        'Invalid email format',
      );
    });

    it('should throw error when email starts with @', () => {
      expect(() => new Email('@user@example.com')).toThrow(
        'Invalid email format',
      );
    });

    it('should throw error when email ends with @', () => {
      expect(() => new Email('user@example.com@')).toThrow(
        'Invalid email format',
      );
    });
  });

  describe('Email Validation - Length Requirements', () => {
    it('should throw error when email exceeds 254 characters', () => {
      const longLocal = 'a'.repeat(250);
      const tooLongEmail = `${longLocal}@example.com`; // 261 chars
      expect(() => new Email(tooLongEmail)).toThrow('Email is too long');
    });

    it('should accept email with 254 characters or less', () => {
      const longLocal = 'a'.repeat(240);
      const maxEmail = `${longLocal}@ex.com`; // 247 chars
      const email = new Email(maxEmail);

      expect(email.value).toBe(maxEmail.toLowerCase());
    });
  });

  describe('Email Equality', () => {
    it('should return true when comparing identical emails', () => {
      const email1 = new Email('user@example.com');
      const email2 = new Email('user@example.com');

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false when comparing different emails', () => {
      const email1 = new Email('user@example.com');
      const email2 = new Email('other@example.com');

      expect(email1.equals(email2)).toBe(false);
    });

    it('should return true when comparing emails with different casing', () => {
      const email1 = new Email('User@Example.COM');
      const email2 = new Email('user@example.com');

      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe('Email toString', () => {
    it('should return email value', () => {
      const email = new Email('user@example.com');

      expect(email.toString()).toBe('user@example.com');
    });

    it('should return lowercase email', () => {
      const email = new Email('User@Example.COM');

      expect(email.toString()).toBe('user@example.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle email with multiple dots in domain', () => {
      const email = new Email('user@mail.company.co.uk');

      expect(email.value).toBe('user@mail.company.co.uk');
    });

    it('should handle email with underscore', () => {
      const email = new Email('first_last@example.com');

      expect(email.value).toBe('first_last@example.com');
    });

    it('should handle email with numbers in domain', () => {
      const email = new Email('user@123example.com');

      expect(email.value).toBe('user@123example.com');
    });

    it('should handle various valid email formats', () => {
      // Basic regex allows these patterns
      const validEmails = [
        'user.name@example.com',
        'first.last@example.com',
        'user123@test.com',
      ];

      validEmails.forEach((emailStr) => {
        const email = new Email(emailStr);
        expect(email.value).toBe(emailStr.toLowerCase());
      });
    });
  });
});
