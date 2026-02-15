import { Password } from './password.vo';

describe('Password Value Object', () => {
  describe('Valid Password Creation', () => {
    it('should create password with all requirements met', () => {
      const validPassword = 'SecurePass123!';
      const password = new Password(validPassword);

      expect(password.value).toBe(validPassword);
    });

    it('should create password with exactly 8 characters', () => {
      const password = new Password('Pass123!');

      expect(password.value).toBe('Pass123!');
    });

    it('should create password with maximum length', () => {
      const longPassword = 'P@ssw0rd' + 'a'.repeat(120); // 128 chars total
      const password = new Password(longPassword);

      expect(password.value).toBe(longPassword);
    });

    it('should create password with multiple special characters', () => {
      const password = new Password('P@ssw0rd!#$%');

      expect(password.value).toBe('P@ssw0rd!#$%');
    });

    it('should create password with numbers at different positions', () => {
      const password = new Password('1Password!');

      expect(password.value).toBe('1Password!');
    });
  });

  describe('Password Validation - Required Field', () => {
    it('should throw error when password is empty string', () => {
      expect(() => new Password('')).toThrow('Password is required');
    });

    it('should throw error when password is null', () => {
      expect(() => new Password(null as any)).toThrow('Password is required');
    });

    it('should throw error when password is undefined', () => {
      expect(() => new Password(undefined as any)).toThrow(
        'Password is required',
      );
    });
  });

  describe('Password Validation - Length Requirements', () => {
    it('should throw error when password is less than 8 characters', () => {
      expect(() => new Password('Pass1!')).toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should throw error when password is exactly 7 characters', () => {
      expect(() => new Password('Pass12!')).toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should throw error when password exceeds 128 characters', () => {
      const tooLongPassword = 'P@ssw0rd' + 'a'.repeat(121); // 129 chars
      expect(() => new Password(tooLongPassword)).toThrow(
        'Password is too long',
      );
    });
  });

  describe('Password Validation - Uppercase Requirement', () => {
    it('should throw error when password has no uppercase letters', () => {
      expect(() => new Password('password123!')).toThrow(
        'Password must contain at least one uppercase letter',
      );
    });

    it('should throw error when password has only lowercase and special chars', () => {
      expect(() => new Password('p@ssword123')).toThrow(
        'Password must contain at least one uppercase letter',
      );
    });
  });

  describe('Password Validation - Lowercase Requirement', () => {
    it('should throw error when password has no lowercase letters', () => {
      expect(() => new Password('PASSWORD123!')).toThrow(
        'Password must contain at least one lowercase letter',
      );
    });

    it('should throw error when password has only uppercase and numbers', () => {
      expect(() => new Password('P@SSWORD123')).toThrow(
        'Password must contain at least one lowercase letter',
      );
    });
  });

  describe('Password Validation - Digit Requirement', () => {
    it('should throw error when password has no digits', () => {
      expect(() => new Password('Password!')).toThrow(
        'Password must contain at least one digit',
      );
    });

    it('should throw error when password has only letters and special chars', () => {
      expect(() => new Password('P@ssword')).toThrow(
        'Password must contain at least one digit',
      );
    });
  });

  describe('Password Validation - Special Character Requirement', () => {
    it('should throw error when password has no special characters', () => {
      expect(() => new Password('Password123')).toThrow(
        'Password must contain at least one special character',
      );
    });

    it('should accept various special characters', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>';
      specialChars.split('').forEach((char) => {
        expect(() => new Password(`Pass123${char}`)).not.toThrow();
      });
    });
  });

  describe('Password Equality', () => {
    it('should return true when comparing identical passwords', () => {
      const password1 = new Password('SecurePass123!');
      const password2 = new Password('SecurePass123!');

      expect(password1.equals(password2)).toBe(true);
    });

    it('should return false when comparing different passwords', () => {
      const password1 = new Password('SecurePass123!');
      const password2 = new Password('DifferentPass456!');

      expect(password1.equals(password2)).toBe(false);
    });

    it('should be case-sensitive in equality comparison', () => {
      const password1 = new Password('SecurePass123!');
      const password2 = new Password('SecurePass123!');
      const password3 = new Password('SecureP@ss456!');

      expect(password1.equals(password2)).toBe(true);
      expect(password1.equals(password3)).toBe(false);
    });
  });

  describe('Password toString', () => {
    it('should not expose actual password value', () => {
      const password = new Password('SecurePass123!');

      expect(password.toString()).toBe('[HIDDEN]');
      expect(password.toString()).not.toContain('SecurePass123!');
    });
  });

  describe('Edge Cases', () => {
    it('should handle password with spaces', () => {
      const password = new Password('Pass 123!Abc');

      expect(password.value).toBe('Pass 123!Abc');
    });

    it('should handle password with unicode characters', () => {
      const password = new Password('Pässw0rd!');

      expect(password.value).toBe('Pässw0rd!');
    });

    it('should validate all requirements together', () => {
      // Missing uppercase
      expect(() => new Password('password123!')).toThrow();
      // Missing lowercase
      expect(() => new Password('PASSWORD123!')).toThrow();
      // Missing digit
      expect(() => new Password('Password!')).toThrow();
      // Missing special char
      expect(() => new Password('Password123')).toThrow();
      // Too short
      expect(() => new Password('Pass1!')).toThrow();
    });
  });
});
