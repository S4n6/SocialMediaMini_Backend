import {
  UserRegisteredEvent,
  UserFollowedEvent,
  UserUnfollowedEvent,
  UserProfileUpdatedEvent,
  UserEmailVerifiedEvent,
} from './user.events';
import { UserProfile } from '../value-objects/user-profile.value-object';

describe('Domain Events', () => {
  describe('UserRegisteredEvent', () => {
    it('should create event with correct properties', () => {
      const profile = new UserProfile({
        fullName: 'John Doe',
        bio: 'Developer',
      });

      const event = new UserRegisteredEvent(
        'user-123',
        'john@example.com',
        'johndoe',
        profile,
      );

      expect(event.eventName).toBe('user.registered');
      expect(event.aggregateId).toBe('user-123');
      expect(event.userId).toBe('user-123');
      expect(event.email).toBe('john@example.com');
      expect(event.username).toBe('johndoe');
      expect(event.profile).toBe(profile);
      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should have timestamp close to creation time', () => {
      const before = new Date();
      const event = new UserRegisteredEvent(
        'user-123',
        'john@example.com',
        'johndoe',
        new UserProfile({ fullName: 'John' }),
      );
      const after = new Date();

      expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('UserFollowedEvent', () => {
    it('should create event with follower and followee IDs', () => {
      const event = new UserFollowedEvent('follower-123', 'followee-456');

      expect(event.eventName).toBe('user.followed');
      expect(event.aggregateId).toBe('follower-123');
      expect(event.followerId).toBe('follower-123');
      expect(event.followeeId).toBe('followee-456');
      expect(event.occurredOn).toBeInstanceOf(Date);
    });
  });

  describe('UserUnfollowedEvent', () => {
    it('should create event with follower and followee IDs', () => {
      const event = new UserUnfollowedEvent('follower-123', 'followee-456');

      expect(event.eventName).toBe('user.unfollowed');
      expect(event.aggregateId).toBe('follower-123');
      expect(event.followerId).toBe('follower-123');
      expect(event.followeeId).toBe('followee-456');
      expect(event.occurredOn).toBeInstanceOf(Date);
    });
  });

  describe('UserProfileUpdatedEvent', () => {
    it('should create event with old and new profiles', () => {
      const oldProfile = new UserProfile({
        fullName: 'Old Name',
        bio: 'Old bio',
      });
      const newProfile = new UserProfile({
        fullName: 'New Name',
        bio: 'New bio',
      });

      const event = new UserProfileUpdatedEvent(
        'user-123',
        oldProfile,
        newProfile,
      );

      expect(event.eventName).toBe('user.profile.updated');
      expect(event.aggregateId).toBe('user-123');
      expect(event.userId).toBe('user-123');
      expect(event.oldProfile).toBe(oldProfile);
      expect(event.newProfile).toBe(newProfile);
      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should detect profile changes', () => {
      const oldProfile = new UserProfile({
        fullName: 'Old Name',
        bio: 'Old bio',
        avatar: 'old-avatar.jpg',
      });
      const newProfile = new UserProfile({
        fullName: 'New Name',
        bio: 'Old bio', // Same
        avatar: 'new-avatar.jpg',
      });

      const event = new UserProfileUpdatedEvent(
        'user-123',
        oldProfile,
        newProfile,
      );

      const changes = event.getProfileChanges();

      expect(changes.fullName).toEqual({
        old: 'Old Name',
        new: 'New Name',
      });
      expect(changes.avatar).toEqual({
        old: 'old-avatar.jpg',
        new: 'new-avatar.jpg',
      });
      expect(changes.bio).toBeUndefined(); // No change
    });

    it('should return empty object when no changes', () => {
      const profile = new UserProfile({
        fullName: 'Same Name',
        bio: 'Same bio',
      });

      const event = new UserProfileUpdatedEvent('user-123', profile, profile);

      const changes = event.getProfileChanges();

      expect(Object.keys(changes)).toHaveLength(0);
    });
  });

  describe('UserEmailVerifiedEvent', () => {
    it('should create event with verification details', () => {
      const verifiedAt = new Date('2024-01-15T10:00:00Z');
      const event = new UserEmailVerifiedEvent(
        'user-123',
        'john@example.com',
        verifiedAt,
      );

      expect(event.eventName).toBe('user.email.verified');
      expect(event.aggregateId).toBe('user-123');
      expect(event.userId).toBe('user-123');
      expect(event.email).toBe('john@example.com');
      expect(event.verifiedAt).toBe(verifiedAt);
      expect(event.occurredOn).toBeInstanceOf(Date);
    });
  });
});
