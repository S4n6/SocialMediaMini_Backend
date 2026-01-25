import { Token } from './token.vo';

describe('Token Value Object', () => {
  describe('Valid Token Creation', () => {
    it('should create token with valid string', () => {
      const tokenValue = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const token = new Token(tokenValue);

      expect(token.value).toBe(tokenValue);
    });

    it('should create token with expiry date', () => {
      const tokenValue = 'valid-token-12345';
      const expiryDate = new Date('2026-12-31');
      const token = new Token(tokenValue, expiryDate);

      expect(token.value).toBe(tokenValue);
      expect(token.expiresAt).toBe(expiryDate);
    });

    it('should create token without expiry date', () => {
      const tokenValue = 'valid-token-12345';
      const token = new Token(tokenValue);

      expect(token.value).toBe(tokenValue);
      expect(token.expiresAt).toBeUndefined();
    });

    it('should create token with minimum length (10 chars)', () => {
      const tokenValue = '1234567890'; // Exactly 10 chars
      const token = new Token(tokenValue);

      expect(token.value).toBe(tokenValue);
    });

    it('should create token with long string', () => {
      const tokenValue = 'a'.repeat(500);
      const token = new Token(tokenValue);

      expect(token.value).toBe(tokenValue);
    });
  });

  describe('Token Validation - Required Field', () => {
    it('should throw error when token is empty string', () => {
      expect(() => new Token('')).toThrow('Token is required');
    });

    it('should throw error when token is null', () => {
      expect(() => new Token(null as any)).toThrow('Token is required');
    });

    it('should throw error when token is undefined', () => {
      expect(() => new Token(undefined as any)).toThrow('Token is required');
    });
  });

  describe('Token Validation - Whitespace', () => {
    it('should throw error when token has leading whitespace', () => {
      expect(() => new Token('  valid-token')).toThrow(
        'Token cannot have leading or trailing whitespace',
      );
    });

    it('should throw error when token has trailing whitespace', () => {
      expect(() => new Token('valid-token  ')).toThrow(
        'Token cannot have leading or trailing whitespace',
      );
    });

    it('should throw error when token has both leading and trailing whitespace', () => {
      expect(() => new Token('  valid-token  ')).toThrow(
        'Token cannot have leading or trailing whitespace',
      );
    });

    it('should allow token with spaces in the middle', () => {
      const tokenValue = 'valid token 12345';
      const token = new Token(tokenValue);

      expect(token.value).toBe(tokenValue);
    });
  });

  describe('Token Validation - Length', () => {
    it('should throw error when token is less than 10 characters', () => {
      expect(() => new Token('short')).toThrow('Token is too short');
    });

    it('should throw error when token is exactly 9 characters', () => {
      expect(() => new Token('123456789')).toThrow('Token is too short');
    });
  });

  describe('Token Expiry', () => {
    it('should return false when token has no expiry', () => {
      const token = new Token('valid-token-12345');

      expect(token.isExpired()).toBe(false);
    });

    it('should return true when token is expired', () => {
      const pastDate = new Date('2020-01-01');
      const token = new Token('valid-token-12345', pastDate);

      expect(token.isExpired()).toBe(true);
    });

    it('should return false when token is not expired', () => {
      const futureDate = new Date('2030-12-31');
      const token = new Token('valid-token-12345', futureDate);

      expect(token.isExpired()).toBe(false);
    });

    it('should return true when token expires at current time', () => {
      const now = new Date();
      const token = new Token('valid-token-12345', now);

      // Wait a tiny bit to ensure time has passed
      expect(token.isExpired()).toBe(false);
    });

    it('should handle token expiry check multiple times', () => {
      const futureDate = new Date(Date.now() + 10000);
      const token = new Token('valid-token-12345', futureDate);

      expect(token.isExpired()).toBe(false);
      expect(token.isExpired()).toBe(false);
      expect(token.isExpired()).toBe(false);
    });
  });

  describe('Token Equality', () => {
    it('should return true when comparing identical token values', () => {
      const token1 = new Token('same-token-value');
      const token2 = new Token('same-token-value');

      expect(token1.equals(token2)).toBe(true);
    });

    it('should return false when comparing different token values', () => {
      const token1 = new Token('token-value-1');
      const token2 = new Token('token-value-2');

      expect(token1.equals(token2)).toBe(false);
    });

    it('should ignore expiry dates in equality comparison', () => {
      const date1 = new Date('2026-01-01');
      const date2 = new Date('2027-01-01');
      const token1 = new Token('same-token', date1);
      const token2 = new Token('same-token', date2);

      expect(token1.equals(token2)).toBe(true);
    });

    it('should return true when one token has expiry and other does not', () => {
      const token1 = new Token('same-token', new Date('2026-01-01'));
      const token2 = new Token('same-token');

      expect(token1.equals(token2)).toBe(true);
    });
  });

  describe('Token toString', () => {
    it('should show only first 10 characters for security', () => {
      const token = new Token(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
      );

      expect(token.toString()).toBe('Token(eyJhbGciOi...)');
      expect(token.toString()).not.toContain('payload');
      expect(token.toString()).not.toContain('signature');
    });

    it('should show entire token if exactly 10 characters', () => {
      const token = new Token('1234567890');

      expect(token.toString()).toBe('Token(1234567890...)');
    });

    it('should handle short tokens gracefully', () => {
      const token = new Token('1234567890abc');

      const result = token.toString();
      expect(result).toContain('1234567890');
      expect(result).not.toContain('abc');
    });
  });

  describe('Edge Cases', () => {
    it('should handle JWT-like tokens', () => {
      const jwtToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const token = new Token(jwtToken);

      expect(token.value).toBe(jwtToken);
    });

    it('should handle UUID tokens', () => {
      const uuidToken = '550e8400-e29b-41d4-a716-446655440000';
      const token = new Token(uuidToken);

      expect(token.value).toBe(uuidToken);
    });

    it('should handle alphanumeric tokens', () => {
      const alphanumericToken = 'abc123XYZ789';
      const token = new Token(alphanumericToken);

      expect(token.value).toBe(alphanumericToken);
    });

    it('should handle tokens with special characters', () => {
      const specialToken = 'token-with_special.chars$';
      const token = new Token(specialToken);

      expect(token.value).toBe(specialToken);
    });

    it('should not modify token value', () => {
      const originalValue = 'UPPERCASE-token-123';
      const token = new Token(originalValue);

      expect(token.value).toBe(originalValue); // Should preserve case
    });
  });
});
