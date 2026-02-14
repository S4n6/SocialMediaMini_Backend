import { Password } from './password.value-object';
import { ValidationException } from '../exceptions/domain.exceptions';

describe('Password Value Object', () => {
  describe('createFromPlainText', () => {
    it('should hash password correctly', async () => {
      const password = await Password.createFromPlainText('MySecurePass123!');
      expect(password.getValue()).toBeDefined();
      expect(password.getValue()).not.toBe('MySecurePass123!');
      expect(password.getValue().length).toBeGreaterThan(30); // bcrypt hashes are longer
    });

    it('should throw ValidationException for empty password', async () => {
      await expect(Password.createFromPlainText('')).rejects.toThrow(
        ValidationException,
      );
      await expect(Password.createFromPlainText('   ')).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw ValidationException for password too short', async () => {
      await expect(Password.createFromPlainText('Short1!')).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw ValidationException for password too long', async () => {
      const longPassword = 'A'.repeat(129) + '1!';
      await expect(Password.createFromPlainText(longPassword)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw ValidationException for password without uppercase', async () => {
      await expect(
        Password.createFromPlainText('lowercase123!'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for password without lowercase', async () => {
      await expect(
        Password.createFromPlainText('UPPERCASE123!'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for password without number', async () => {
      await expect(
        Password.createFromPlainText('NoNumberPass!'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for password without special character', async () => {
      await expect(
        Password.createFromPlainText('NoSpecialChar123'),
      ).rejects.toThrow(ValidationException);
    });

    it('should accept valid passwords meeting all requirements', async () => {
      const validPasswords = [
        'MyStr0ng123!',
        'Secure@2024',
        'C0mpl3x#Wrd',
        'Str0ng$Token',
      ];

      for (const pass of validPasswords) {
        await expect(Password.createFromPlainText(pass)).resolves.toBeDefined();
      }
    });
  });

  describe('createFromHash', () => {
    it('should create password from existing hash', () => {
      const hash = '$2b$12$abcdefghijklmnopqrstuvwxyz123456789';
      const password = Password.createFromHash(hash);
      expect(password.getValue()).toBe(hash);
    });

    it('should throw ValidationException for empty hash', () => {
      expect(() => Password.createFromHash('')).toThrow(ValidationException);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const plainPassword = 'MySecurePass123!';
      const password = await Password.createFromPlainText(plainPassword);
      const isMatch = await password.compare(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = await Password.createFromPlainText('MySecurePass123!');
      const isMatch = await password.compare('WrongPassword123!');
      expect(isMatch).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const password = await Password.createFromPlainText('MySecurePass123!');
      const isMatch = await password.compare('mysecurepass123!');
      expect(isMatch).toBe(false);
    });
  });

  describe('isValidFormat', () => {
    it('should return true for valid password format', () => {
      expect(Password.isValidFormat('MySecurePass123!')).toBe(true);
      expect(Password.isValidFormat('SecureP@ssw0rd')).toBe(true);
    });

    it('should return false for invalid password format', () => {
      expect(Password.isValidFormat('short')).toBe(false);
      expect(Password.isValidFormat('noupppercase123!')).toBe(false);
      expect(Password.isValidFormat('NOLOWERCASE123!')).toBe(false);
      expect(Password.isValidFormat('NoNumbers!')).toBe(false);
      expect(Password.isValidFormat('NoSpecialChar123')).toBe(false);
    });
  });

  describe('equality', () => {
    it('should be equal for same hash', () => {
      const hash = '$2b$12$abcdefghijklmnopqrstuvwxyz123456789';
      const password1 = Password.createFromHash(hash);
      const password2 = Password.createFromHash(hash);
      expect(password1.equals(password2)).toBe(true);
    });

    it('should not be equal for different hashes', async () => {
      const password1 = await Password.createFromPlainText('Pass1234!');
      const password2 = await Password.createFromPlainText('Pass5678!');
      expect(password1.equals(password2)).toBe(false);
    });
  });

  describe('edge cases and security', () => {
    it('should handle passwords with all special characters', async () => {
      const password = await Password.createFromPlainText('P@$$w0rd!#$%^&*()');
      expect(password.getValue()).toBeDefined();
    });

    it('should handle passwords with mixed scripts (unicode)', async () => {
      const password = await Password.createFromPlainText('PäSsw0rd!2024');
      expect(password.getValue()).toBeDefined();
    });

    it('should handle passwords with emojis', async () => {
      const password = await Password.createFromPlainText('MyPass123!😀');
      expect(password.getValue()).toBeDefined();
    });

    it('should reject passwords with only spaces', async () => {
      // Empty after trim
      await expect(Password.createFromPlainText('        ')).rejects.toThrow(
        ValidationException,
      );
    });

    it('should accept passwords with leading/trailing spaces', async () => {
      // Password validates the FULL string including spaces
      // '   MyPass123!   ' = 17 chars total, valid
      await expect(
        Password.createFromPlainText('   MyPass123!   '),
      ).resolves.toBeDefined();
    });

    it('should handle boundary length (exactly 8 chars)', async () => {
      await expect(
        Password.createFromPlainText('Pass123!'),
      ).resolves.toBeDefined();
    });

    it('should handle boundary length (exactly 128 chars)', async () => {
      const maxLengthPassword = 'A'.repeat(121) + 'a1!@#$%'; // 128 chars total
      await expect(
        Password.createFromPlainText(maxLengthPassword),
      ).resolves.toBeDefined();
    });

    it('should reject password with 129 characters', async () => {
      const tooLongPassword = 'A'.repeat(122) + 'a1!@#$%'; // 129 chars
      await expect(
        Password.createFromPlainText(tooLongPassword),
      ).rejects.toThrow(ValidationException);
    });

    it('should consistently hash same password differently (salt)', async () => {
      const plainPassword = 'MySecurePass123!';
      const password1 = await Password.createFromPlainText(plainPassword);
      const password2 = await Password.createFromPlainText(plainPassword);

      // Hashes should be different due to different salts
      expect(password1.getValue()).not.toBe(password2.getValue());

      // But both should validate correctly
      expect(await password1.compare(plainPassword)).toBe(true);
      expect(await password2.compare(plainPassword)).toBe(true);
    });

    it('should handle bcrypt hash format validation', () => {
      const validBcryptHash =
        '$2b$12$KIXcoRPNGFRbXwLhLTzZce5YGOvRxSn3Z9K9qD0YpQq0XYZvFpJQe';
      expect(() => Password.createFromHash(validBcryptHash)).not.toThrow();
    });

    it('should reject passwords with only numbers and special chars (no letters)', async () => {
      await expect(Password.createFromPlainText('12345678!@#')).rejects.toThrow(
        ValidationException,
      );
    });

    it('should reject passwords with only letters (no numbers/special)', async () => {
      await expect(
        Password.createFromPlainText('OnlyLettersHere'),
      ).rejects.toThrow(ValidationException);
    });

    it('should handle passwords with consecutive special chars', async () => {
      await expect(
        Password.createFromPlainText('MyP@ss!!!123'),
      ).resolves.toBeDefined();
    });

    it('should handle passwords with numbers at different positions', async () => {
      await expect(
        Password.createFromPlainText('1MyStr0ng!'),
      ).resolves.toBeDefined();
      await expect(
        Password.createFromPlainText('MyStr0ng!2'),
      ).resolves.toBeDefined();
      await expect(
        Password.createFromPlainText('My3Str0ng!'),
      ).resolves.toBeDefined();
    });

    it('should reject password with null or undefined', async () => {
      await expect(Password.createFromPlainText(null as any)).rejects.toThrow(
        ValidationException,
      );
      await expect(
        Password.createFromPlainText(undefined as any),
      ).rejects.toThrow(ValidationException);
    });
  });
});
