import { UserProfile } from './user-profile.value-object';
import { ValidationException } from '../exceptions/domain.exceptions';

describe('UserProfile Value Object', () => {
  describe('creation', () => {
    it('should create profile with valid full name', () => {
      const profile = new UserProfile({
        fullName: 'John Doe',
      });

      expect(profile.fullName).toBe('John Doe');
    });

    it('should create profile with all fields', () => {
      const profile = new UserProfile({
        fullName: 'Jane Smith',
        bio: 'Software developer and tech enthusiast',
        avatar: 'https://example.com/avatar.jpg',
        location: 'San Francisco, CA',
        websiteUrl: 'https://janesmith.dev',
        dateOfBirth: new Date('1995-03-15'),
        phoneNumber: '+14155551234',
        gender: 'female',
      });

      expect(profile.fullName).toBe('Jane Smith');
      expect(profile.bio).toBe('Software developer and tech enthusiast');
      expect(profile.avatar).toBe('https://example.com/avatar.jpg');
      expect(profile.location).toBe('San Francisco, CA');
      expect(profile.websiteUrl).toBe('https://janesmith.dev');
      expect(profile.dateOfBirth).toEqual(new Date('1995-03-15'));
      expect(profile.phoneNumber).toBe('+14155551234');
      expect(profile.gender).toBe('female');
    });

    it('should create profile with optional fields undefined', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
      });

      expect(profile.bio).toBeUndefined();
      expect(profile.avatar).toBeUndefined();
      expect(profile.location).toBeUndefined();
      expect(profile.websiteUrl).toBeUndefined();
      expect(profile.dateOfBirth).toBeUndefined();
      expect(profile.phoneNumber).toBeUndefined();
      expect(profile.gender).toBeUndefined();
    });
  });

  describe('fullName validation', () => {
    it('should throw error when fullName is empty', () => {
      expect(() => new UserProfile({ fullName: '' })).toThrow(
        ValidationException,
      );
    });

    it('should throw error when fullName is null', () => {
      expect(() => new UserProfile({ fullName: null as any })).toThrow(
        ValidationException,
      );
    });

    it('should throw error when fullName is undefined', () => {
      expect(() => new UserProfile({ fullName: undefined as any })).toThrow(
        ValidationException,
      );
    });

    it('should throw error when fullName is only whitespace', () => {
      expect(() => new UserProfile({ fullName: '   ' })).toThrow(
        ValidationException,
      );
    });

    it('should throw error when fullName is too short (< 2 chars)', () => {
      expect(() => new UserProfile({ fullName: 'A' })).toThrow(
        ValidationException,
      );
    });

    it('should accept fullName with exactly 2 characters', () => {
      const profile = new UserProfile({ fullName: 'Ab' });
      expect(profile.fullName).toBe('Ab');
    });

    it('should throw error when fullName exceeds 100 characters', () => {
      const longName = 'A'.repeat(101);
      expect(() => new UserProfile({ fullName: longName })).toThrow(
        ValidationException,
      );
    });

    it('should accept fullName with exactly 100 characters', () => {
      const maxName = 'A'.repeat(100);
      const profile = new UserProfile({ fullName: maxName });
      expect(profile.fullName).toBe(maxName);
    });

    it('should accept fullName with special characters', () => {
      const profile = new UserProfile({ fullName: "O'Brien-Smith Jr." });
      expect(profile.fullName).toBe("O'Brien-Smith Jr.");
    });

    it('should accept fullName with unicode characters', () => {
      const profile = new UserProfile({ fullName: 'José García' });
      expect(profile.fullName).toBe('José García');
    });
  });

  describe('bio validation', () => {
    it('should accept empty bio', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        bio: '',
      });
      expect(profile.bio).toBe('');
    });

    it('should accept bio with up to 500 characters', () => {
      const maxBio = 'A'.repeat(500);
      const profile = new UserProfile({
        fullName: 'Test User',
        bio: maxBio,
      });
      expect(profile.bio).toBe(maxBio);
    });

    it('should throw error when bio exceeds 500 characters', () => {
      const longBio = 'A'.repeat(501);
      expect(
        () =>
          new UserProfile({
            fullName: 'Test User',
            bio: longBio,
          }),
      ).toThrow(ValidationException);
    });

    it('should accept bio with newlines and special characters', () => {
      const bio = 'Line 1\nLine 2\n✨ Emoji & symbols!';
      const profile = new UserProfile({
        fullName: 'Test User',
        bio,
      });
      expect(profile.bio).toBe(bio);
    });
  });

  describe('websiteUrl validation', () => {
    it('should accept valid HTTP URL', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        websiteUrl: 'http://example.com',
      });
      expect(profile.websiteUrl).toBe('http://example.com');
    });

    it('should accept valid HTTPS URL', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        websiteUrl: 'https://example.com',
      });
      expect(profile.websiteUrl).toBe('https://example.com');
    });

    it('should accept URL with path', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        websiteUrl: 'https://example.com/path/to/page',
      });
      expect(profile.websiteUrl).toBe('https://example.com/path/to/page');
    });

    it('should accept URL with query parameters', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        websiteUrl: 'https://example.com?query=param',
      });
      expect(profile.websiteUrl).toBe('https://example.com?query=param');
    });

    it('should throw error for invalid URL format', () => {
      expect(
        () =>
          new UserProfile({
            fullName: 'Test User',
            websiteUrl: 'not-a-valid-url',
          }),
      ).toThrow(ValidationException);
    });

    it('should throw error for URL without protocol', () => {
      expect(
        () =>
          new UserProfile({
            fullName: 'Test User',
            websiteUrl: 'example.com',
          }),
      ).toThrow(ValidationException);
    });

    it('should accept undefined websiteUrl', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        websiteUrl: undefined,
      });
      expect(profile.websiteUrl).toBeUndefined();
    });
  });

  describe('phoneNumber validation', () => {
    it('should accept valid phone number with country code', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        phoneNumber: '+14155551234',
      });
      expect(profile.phoneNumber).toBe('+14155551234');
    });

    it('should accept phone number with spaces', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        phoneNumber: '+1 415 555 1234',
      });
      expect(profile.phoneNumber).toBe('+1 415 555 1234');
    });

    it('should accept phone number with hyphens', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        phoneNumber: '+1-415-555-1234',
      });
      expect(profile.phoneNumber).toBe('+1-415-555-1234');
    });

    it('should accept phone number with parentheses', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        phoneNumber: '+1 (415) 555-1234',
      });
      expect(profile.phoneNumber).toBe('+1 (415) 555-1234');
    });

    it('should throw error for phone number with letters', () => {
      expect(
        () =>
          new UserProfile({
            fullName: 'Test User',
            phoneNumber: '+1-415-CALL-NOW',
          }),
      ).toThrow(ValidationException);
    });

    it('should throw error for phone number with less than 10 digits', () => {
      expect(
        () =>
          new UserProfile({
            fullName: 'Test User',
            phoneNumber: '+1234567',
          }),
      ).toThrow(ValidationException);
    });

    it('should accept phone number with exactly 10 digits', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        phoneNumber: '1234567890',
      });
      expect(profile.phoneNumber).toBe('1234567890');
    });

    it('should accept international phone formats', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        phoneNumber: '+44 20 7946 0958',
      });
      expect(profile.phoneNumber).toBe('+44 20 7946 0958');
    });
  });

  describe('dateOfBirth validation', () => {
    it('should accept valid date in the past', () => {
      const pastDate = new Date('1990-01-01');
      const profile = new UserProfile({
        fullName: 'Test User',
        dateOfBirth: pastDate,
      });
      expect(profile.dateOfBirth).toEqual(pastDate);
    });

    it('should throw error for date in the future', () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      expect(
        () =>
          new UserProfile({
            fullName: 'Test User',
            dateOfBirth: futureDate,
          }),
      ).toThrow(ValidationException);
    });

    it("should throw error for today's date", () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of day to ensure it's not in past
      expect(
        () =>
          new UserProfile({
            fullName: 'Test User',
            dateOfBirth: today,
          }),
      ).toThrow(ValidationException);
    });

    it('should accept date from many years ago', () => {
      const oldDate = new Date('1920-01-01');
      const profile = new UserProfile({
        fullName: 'Test User',
        dateOfBirth: oldDate,
      });
      expect(profile.dateOfBirth).toEqual(oldDate);
    });
  });

  describe('isComplete', () => {
    it('should return true when all required fields are present', () => {
      const profile = new UserProfile({
        fullName: 'Complete User',
        bio: 'Has a bio',
        avatar: 'https://example.com/avatar.jpg',
      });

      expect(profile.isComplete()).toBe(true);
    });

    it('should return false when bio is missing', () => {
      const profile = new UserProfile({
        fullName: 'Incomplete User',
        avatar: 'https://example.com/avatar.jpg',
      });

      expect(profile.isComplete()).toBe(false);
    });

    it('should return false when avatar is missing', () => {
      const profile = new UserProfile({
        fullName: 'Incomplete User',
        bio: 'Has a bio',
      });

      expect(profile.isComplete()).toBe(false);
    });

    it('should return false when both bio and avatar are missing', () => {
      const profile = new UserProfile({
        fullName: 'Incomplete User',
      });

      expect(profile.isComplete()).toBe(false);
    });
  });

  describe('update', () => {
    it('should create new profile with updated values', () => {
      const original = new UserProfile({
        fullName: 'Original Name',
        bio: 'Original bio',
      });

      const updated = original.update({
        fullName: 'Updated Name',
      });

      expect(updated.fullName).toBe('Updated Name');
      expect(updated.bio).toBe('Original bio');
      expect(original.fullName).toBe('Original Name'); // Original unchanged
    });

    it('should preserve other fields when updating one field', () => {
      const original = new UserProfile({
        fullName: 'John Doe',
        bio: 'Developer',
        location: 'NYC',
        websiteUrl: 'https://example.com',
      });

      const updated = original.update({
        bio: 'Senior Developer',
      });

      expect(updated.fullName).toBe('John Doe');
      expect(updated.bio).toBe('Senior Developer');
      expect(updated.location).toBe('NYC');
      expect(updated.websiteUrl).toBe('https://example.com');
    });

    it('should allow updating multiple fields', () => {
      const original = new UserProfile({
        fullName: 'John Doe',
        bio: 'Developer',
      });

      const updated = original.update({
        fullName: 'Jane Doe',
        bio: 'Senior Developer',
        location: 'San Francisco',
      });

      expect(updated.fullName).toBe('Jane Doe');
      expect(updated.bio).toBe('Senior Developer');
      expect(updated.location).toBe('San Francisco');
    });
  });

  describe('value object equality', () => {
    it('should consider two profiles equal with same values', () => {
      const profile1 = new UserProfile({
        fullName: 'John Doe',
        bio: 'Test bio',
        location: 'NYC',
      });

      const profile2 = new UserProfile({
        fullName: 'John Doe',
        bio: 'Test bio',
        location: 'NYC',
      });

      expect(profile1.equals(profile2)).toBe(true);
    });

    it('should consider profiles different with different fullName', () => {
      const profile1 = new UserProfile({
        fullName: 'John Doe',
      });

      const profile2 = new UserProfile({
        fullName: 'Jane Doe',
      });

      expect(profile1.equals(profile2)).toBe(false);
    });

    it('should consider profiles different with different bio', () => {
      const profile1 = new UserProfile({
        fullName: 'John Doe',
        bio: 'Bio 1',
      });

      const profile2 = new UserProfile({
        fullName: 'John Doe',
        bio: 'Bio 2',
      });

      expect(profile1.equals(profile2)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle fullName with leading/trailing spaces', () => {
      const profile = new UserProfile({
        fullName: '  John Doe  ',
      });

      // The value should be stored as-is (validation checks trimmed length)
      expect(profile.fullName).toBe('  John Doe  ');
    });

    it('should handle empty strings for optional fields', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        bio: '',
        location: '',
        gender: '',
      });

      expect(profile.bio).toBe('');
      expect(profile.location).toBe('');
      expect(profile.gender).toBe('');
    });

    it('should handle null values gracefully', () => {
      const profile = new UserProfile({
        fullName: 'Test User',
        bio: null as any,
        location: null as any,
      });

      // Nulls are stored as null
      expect(profile.bio).toBeNull();
      expect(profile.location).toBeNull();
    });
  });
});
