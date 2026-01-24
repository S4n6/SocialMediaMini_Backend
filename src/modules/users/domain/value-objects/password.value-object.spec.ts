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
});
