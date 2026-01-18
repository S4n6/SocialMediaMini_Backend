import { UserId } from './user-id.value-object';
import { ValidationException } from '../exceptions/domain.exceptions';

describe('UserId Value Object', () => {
  describe('creation', () => {
    it('should create UserId from valid UUID string', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId = UserId.create(uuid);
      expect(userId.getValue()).toBe(uuid);
    });

    it('should throw ValidationException for invalid UUID format', () => {
      expect(() => UserId.create('invalid-uuid')).toThrow(ValidationException);
      expect(() => UserId.create('123456')).toThrow(ValidationException);
      expect(() => UserId.create('')).toThrow(ValidationException);
    });

    it('should throw ValidationException for empty string', () => {
      expect(() => UserId.create('')).toThrow(ValidationException);
      expect(() => UserId.create('   ')).toThrow(ValidationException);
    });
  });

  describe('generate', () => {
    it('should generate valid UUID', () => {
      const userId = UserId.generate();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(userId.getValue())).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();
      expect(userId1.equals(userId2)).toBe(false);
    });

    it('should generate multiple unique UUIDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(UserId.generate().getValue());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('equality', () => {
    it('should be equal when UUIDs are the same', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId1 = UserId.create(uuid);
      const userId2 = UserId.create(uuid);
      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should not be equal when UUIDs differ', () => {
      const userId1 = UserId.create('123e4567-e89b-12d3-a456-426614174000');
      const userId2 = UserId.create('987e6543-e21c-12d3-a456-426614174999');
      expect(userId1.equals(userId2)).toBe(false);
    });

    it('should be case-sensitive for equality', () => {
      const userId1 = UserId.create('123E4567-E89B-12D3-A456-426614174000');
      const userId2 = UserId.create('123e4567-e89b-12d3-a456-426614174000');
      expect(userId1.equals(userId2)).toBe(false);
    });
  });
});
