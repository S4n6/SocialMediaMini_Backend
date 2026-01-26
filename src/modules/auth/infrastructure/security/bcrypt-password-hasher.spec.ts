import { BcryptPasswordHasher } from './bcrypt-password-hasher';
import { Password } from '../../domain/value-objects/password.vo';
import * as bcrypt from 'bcrypt';

// Mock bcrypt module
jest.mock('bcrypt');

describe('BcryptPasswordHasher', () => {
  let passwordHasher: BcryptPasswordHasher;
  let mockBcrypt: jest.Mocked<typeof bcrypt>;

  beforeEach(() => {
    passwordHasher = new BcryptPasswordHasher();
    mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('should hash a password using bcrypt', async () => {
      // Arrange
      const password = new Password('SecurePassword123!');
      const mockSalt = 'mock_salt_12_rounds';
      const mockHash = '$2b$12$mockHashedPassword';

      mockBcrypt.genSalt.mockResolvedValue(mockSalt as never);
      mockBcrypt.hash.mockResolvedValue(mockHash as never);

      // Act
      const result = await passwordHasher.hash(password);

      // Assert
      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password.value, mockSalt);
      expect(result).toBe(mockHash);
    });

    it('should use 12 salt rounds', async () => {
      // Arrange
      const password = new Password('TestPassword123!');
      mockBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockBcrypt.hash.mockResolvedValue('hash' as never);

      // Act
      await passwordHasher.hash(password);

      // Assert
      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(12);
    });

    it('should handle different password values', async () => {
      // Arrange
      const passwords = [
        'Simple123!',
        'VeryLongPasswordWith!Special@Characters#123',
        'Short123!',
      ];

      mockBcrypt.genSalt.mockResolvedValue('salt' as never);

      for (const pwd of passwords) {
        const password = new Password(pwd);
        const expectedHash = `hashed_${pwd}`;
        mockBcrypt.hash.mockResolvedValue(expectedHash as never);

        // Act
        const result = await passwordHasher.hash(password);

        // Assert
        expect(mockBcrypt.hash).toHaveBeenCalledWith(pwd, 'salt');
        expect(result).toBe(expectedHash);
      }
    });

    it('should propagate bcrypt errors', async () => {
      // Arrange
      const password = new Password('TestPassword123!');
      const error = new Error('Bcrypt hashing failed');

      mockBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockBcrypt.hash.mockRejectedValue(error as never);

      // Act & Assert
      await expect(passwordHasher.hash(password)).rejects.toThrow(
        'Bcrypt hashing failed',
      );
    });
  });

  describe('verify', () => {
    it('should verify a correct password against its hash', async () => {
      // Arrange
      const password = new Password('CorrectPassword123!');
      const hash = '$2b$12$correctHashValue';

      mockBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const result = await passwordHasher.verify(password, hash);

      // Assert
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password.value, hash);
      expect(result).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      // Arrange
      const password = new Password('WrongPassword123!');
      const hash = '$2b$12$correctHashValue';

      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act
      const result = await passwordHasher.verify(password, hash);

      // Assert
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password.value, hash);
      expect(result).toBe(false);
    });

    it('should return false when bcrypt.compare throws an error', async () => {
      // Arrange
      const password = new Password('TestPassword123!');
      const hash = 'invalid_hash';
      const error = new Error('Invalid hash format');

      mockBcrypt.compare.mockRejectedValue(error as never);

      // Act
      const result = await passwordHasher.verify(password, hash);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle various password-hash combinations', async () => {
      // Arrange
      const testCases = [
        {
          password: 'Password1!',
          hash: '$2b$12$hash1',
          expected: true,
        },
        {
          password: 'Password2!',
          hash: '$2b$12$hash2',
          expected: false,
        },
        {
          password: 'ComplexP@ssw0rd!',
          hash: '$2b$12$hash3',
          expected: true,
        },
      ];

      for (const testCase of testCases) {
        const password = new Password(testCase.password);
        mockBcrypt.compare.mockResolvedValue(testCase.expected as never);

        // Act
        const result = await passwordHasher.verify(password, testCase.hash);

        // Assert
        expect(result).toBe(testCase.expected);
      }
    });

    it('should call bcrypt.compare with correct arguments', async () => {
      // Arrange
      const password = new Password('TestPassword123!');
      const hash = '$2b$12$testHash';

      mockBcrypt.compare.mockResolvedValue(true as never);

      // Act
      await passwordHasher.verify(password, hash);

      // Assert
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password.value, hash);
    });
  });

  describe('generateSalt', () => {
    it('should generate a salt with 12 rounds', async () => {
      // Arrange
      const mockSalt = '$2b$12$mockGeneratedSalt';
      mockBcrypt.genSalt.mockResolvedValue(mockSalt as never);

      // Act
      const result = await passwordHasher.generateSalt();

      // Assert
      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(result).toBe(mockSalt);
    });

    it('should generate different salts on multiple calls', async () => {
      // Arrange
      const salts = ['salt1', 'salt2', 'salt3'];
      mockBcrypt.genSalt
        .mockResolvedValueOnce(salts[0] as never)
        .mockResolvedValueOnce(salts[1] as never)
        .mockResolvedValueOnce(salts[2] as never);

      // Act
      const results = await Promise.all([
        passwordHasher.generateSalt(),
        passwordHasher.generateSalt(),
        passwordHasher.generateSalt(),
      ]);

      // Assert
      expect(results).toEqual(salts);
      expect(mockBcrypt.genSalt).toHaveBeenCalledTimes(3);
    });

    it('should propagate genSalt errors', async () => {
      // Arrange
      const error = new Error('Salt generation failed');
      mockBcrypt.genSalt.mockRejectedValue(error as never);

      // Act & Assert
      await expect(passwordHasher.generateSalt()).rejects.toThrow(
        'Salt generation failed',
      );
    });
  });

  describe('Integration behavior', () => {
    it('should use generated salt in hash method', async () => {
      // Arrange
      const password = new Password('TestPassword123!');
      const generatedSalt = 'generated_salt';
      const expectedHash = 'hashed_password';

      mockBcrypt.genSalt.mockResolvedValue(generatedSalt as never);
      mockBcrypt.hash.mockResolvedValue(expectedHash as never);

      // Act
      const result = await passwordHasher.hash(password);

      // Assert
      expect(mockBcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(
        password.value,
        generatedSalt,
      );
      expect(result).toBe(expectedHash);
    });

    it('should verify a password that was hashed with the same hasher', async () => {
      // Arrange
      const password = new Password('TestPassword123!');
      const hash = 'hashed_value';

      mockBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockBcrypt.hash.mockResolvedValue(hash as never);
      mockBcrypt.compare.mockResolvedValue(true as never);

      // Act
      const hashedPassword = await passwordHasher.hash(password);
      const isValid = await passwordHasher.verify(password, hashedPassword);

      // Assert
      expect(isValid).toBe(true);
    });
  });

  describe('Security properties', () => {
    it('should use a secure number of salt rounds (>=10)', async () => {
      // Arrange
      mockBcrypt.genSalt.mockResolvedValue('salt' as never);

      // Act
      await passwordHasher.generateSalt();

      // Assert
      const saltRounds = mockBcrypt.genSalt.mock.calls[0][0] as number;
      expect(saltRounds).toBeGreaterThanOrEqual(10);
    });

    it('should not expose raw password value in any operation', async () => {
      // Arrange
      const password = new Password('SecurePassword123!');
      mockBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockBcrypt.hash.mockResolvedValue('hash' as never);

      // Act
      const hash = await passwordHasher.hash(password);

      // Assert
      expect(hash).not.toContain('SecurePassword123!');
      expect(hash).not.toBe(password.value);
    });

    it('should handle concurrent hashing operations', async () => {
      // Arrange
      const passwords = [
        new Password('Password1!'),
        new Password('Password2!'),
        new Password('Password3!'),
      ];

      mockBcrypt.genSalt.mockResolvedValue('salt' as never);
      passwords.forEach((pwd, idx) => {
        mockBcrypt.hash.mockResolvedValueOnce(`hash${idx}` as never);
      });

      // Act
      const results = await Promise.all(
        passwords.map((pwd) => passwordHasher.hash(pwd)),
      );

      // Assert
      expect(results).toHaveLength(3);
      expect(mockBcrypt.hash).toHaveBeenCalledTimes(3);
    });
  });
});
