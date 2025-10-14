import { Entity } from '../../../shared/domain/entity.base';
import { UserProfile } from './user-profile.value-object';
import {
  UserRegisteredEvent,
  UserFollowedEvent,
  UserUnfollowedEvent,
  UserProfileUpdatedEvent,
  UserEmailVerifiedEvent,
} from './user.events';
import {
  CannotFollowSelfException,
  AlreadyFollowingUserException,
  NotFollowingUserException,
  UserAccountInactiveException,
  EmailNotVerifiedException,
  ProfileUpdateTooFrequentException,
} from './user.exceptions';
// Simple DomainException class for now
class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

/**
 * User Domain Entity
 * Encapsulates user business logic and invariants
 */
export class User extends Entity<string> {
  private _username: string;
  private _email: string;
  private _passwordHash?: string;
  private _profile: UserProfile;
  private _role: UserRole;
  private _status: UserStatus;
  private _isEmailVerified: boolean;
  private _emailVerifiedAt?: Date;
  private _googleId?: string;
  private _avatar?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastProfileUpdate?: Date;
  private _followingIds: Set<string> = new Set();
  private _followerIds: Set<string> = new Set();

  constructor(
    id: string,
    username: string,
    email: string,
    profile: UserProfile,
    options?: {
      passwordHash?: string;
      googleId?: string;
      role?: UserRole;
      status?: UserStatus;
      isEmailVerified?: boolean;
      emailVerifiedAt?: Date;
      createdAt?: Date;
      updatedAt?: Date;
      lastProfileUpdate?: Date;
      avatar?: string;
    },
  ) {
    super(id);
    this._username = username;
    this._email = email;
    this._profile = profile;
    this._passwordHash = options?.passwordHash;
    this._googleId = options?.googleId;
    this._role = options?.role || UserRole.USER;
    this._status = options?.status || UserStatus.ACTIVE;
    this._isEmailVerified = options?.isEmailVerified || false;
    this._emailVerifiedAt = options?.emailVerifiedAt;
    this._createdAt = options?.createdAt || new Date();
    this._updatedAt = options?.updatedAt || new Date();
    this._lastProfileUpdate = options?.lastProfileUpdate;
    this._avatar = options?.avatar;

    // If it's a new registration, raise domain event
    if (!options?.createdAt) {
      this.addDomainEvent(
        new UserRegisteredEvent(id, email, username, profile),
      );
    }
  }

  // Getters
  get username(): string {
    return this._username;
  }

  get email(): string {
    return this._email;
  }

  get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  get profile(): UserProfile {
    return this._profile;
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }

  get emailVerifiedAt(): Date | undefined {
    return this._emailVerifiedAt;
  }

  get googleId(): string | undefined {
    return this._googleId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastProfileUpdate(): Date | undefined {
    return this._lastProfileUpdate;
  }

  get followingCount(): number {
    return this._followingIds.size;
  }

  get followersCount(): number {
    return this._followerIds.size;
  }

  get followingIds(): string[] {
    return Array.from(this._followingIds);
  }

  get followerIds(): string[] {
    return Array.from(this._followerIds);
  }

  // Business Logic Methods

  /**
   * Check if user can perform actions (must be active and verified for certain actions)
   */
  public canPerformAction(requireEmailVerification: boolean = false): boolean {
    if (this._status !== UserStatus.ACTIVE) {
      throw new UserAccountInactiveException();
    }

    if (requireEmailVerification && !this._isEmailVerified) {
      throw new EmailNotVerifiedException();
    }

    return true;
  }

  /**
   * Follow another user
   */
  public follow(targetUserId: string, targetUsername: string): void {
    this.canPerformAction(true); // Require email verification

    if (targetUserId === this._id) {
      throw new CannotFollowSelfException();
    }

    if (this._followingIds.has(targetUserId)) {
      throw new AlreadyFollowingUserException(targetUsername);
    }

    this._followingIds.add(targetUserId);
    this._updatedAt = new Date();

    this.addDomainEvent(new UserFollowedEvent(this._id, targetUserId));
  }

  /**
   * Unfollow a user
   */
  public unfollow(targetUserId: string, targetUsername: string): void {
    this.canPerformAction();

    if (!this._followingIds.has(targetUserId)) {
      throw new NotFollowingUserException(targetUsername);
    }

    this._followingIds.delete(targetUserId);
    this._updatedAt = new Date();

    this.addDomainEvent(new UserUnfollowedEvent(this._id, targetUserId));
  }

  /**
   * Check if this user is following another user
   */
  public isFollowing(userId: string): boolean {
    return this._followingIds.has(userId);
  }

  /**
   * Check if this user is followed by another user
   */
  public isFollowedBy(userId: string): boolean {
    return this._followerIds.has(userId);
  }

  /**
   * Add a follower (called when someone follows this user)
   */
  public addFollower(followerId: string): void {
    this._followerIds.add(followerId);
  }

  /**
   * Remove a follower (called when someone unfollows this user)
   */
  public removeFollower(followerId: string): void {
    this._followerIds.delete(followerId);
  }

  /**
   * Update user profile
   */
  public updateProfile(newProfile: UserProfile): void {
    this.canPerformAction();

    // Business rule: Can only update profile once per day
    const now = new Date();
    if (this._lastProfileUpdate) {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      if (this._lastProfileUpdate > oneDayAgo) {
        const nextAllowedUpdate = new Date(
          this._lastProfileUpdate.getTime() + 24 * 60 * 60 * 1000,
        );
        throw new ProfileUpdateTooFrequentException(nextAllowedUpdate);
      }
    }

    const oldProfile = this._profile;
    this._profile = newProfile;
    this._lastProfileUpdate = now;
    this._updatedAt = now;

    this.addDomainEvent(
      new UserProfileUpdatedEvent(this._id, oldProfile, newProfile),
    );
  }

  /**
   * Verify user email
   */
  public verifyEmail(): void {
    if (this._isEmailVerified) {
      return; // Already verified
    }

    const now = new Date();
    this._isEmailVerified = true;
    this._emailVerifiedAt = now;
    this._updatedAt = now;

    this.addDomainEvent(new UserEmailVerifiedEvent(this._id, this._email, now));
  }

  /**
   * Check if user can create posts (business rule)
   */
  public canCreatePost(): boolean {
    this.canPerformAction(true);

    // Business rule: User must be registered for at least 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return this._createdAt <= oneHourAgo;
  }

  /**
   * Check if user can comment (business rule)
   */
  public canComment(): boolean {
    this.canPerformAction(true);
    return true; // Email verified users can comment
  }

  /**
   * Change user status (admin function)
   */
  public changeStatus(newStatus: UserStatus): void {
    if (this._status !== newStatus) {
      this._status = newStatus;
      this._updatedAt = new Date();
    }
  }

  /**
   * Set following and follower lists (used when loading from database)
   */
  public setFollowingAndFollowers(
    followingIds: string[],
    followerIds: string[],
  ): void {
    this._followingIds = new Set(followingIds);
    this._followerIds = new Set(followerIds);
  }

  /**
   * Check if user has reached following limit (business rule)
   */
  public hasReachedFollowingLimit(): boolean {
    const MAX_FOLLOWING = 7500; // Instagram-like limit
    return this._followingIds.size >= MAX_FOLLOWING;
  }

  /**
   * Check if user is popular (has many followers)
   */
  public isPopularUser(): boolean {
    return this._followerIds.size >= 10000;
  }

  /**
   * Check if user is verified (different from email verification)
   */
  public isVerifiedUser(): boolean {
    return (
      this._role === UserRole.ADMIN ||
      this._role === UserRole.MODERATOR ||
      this.isPopularUser()
    );
  }

  /**
   * Check if user can moderate content
   */
  public canModerate(): boolean {
    return this._role === UserRole.ADMIN || this._role === UserRole.MODERATOR;
  }

  /**
   * Check if user is admin
   */
  public isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  /**
   * Update last activity (for session management)
   */
  public updateLastActivity(): void {
    this._updatedAt = new Date();
  }

  /**
   * Check if account is fresh (less than 24 hours old)
   */
  public isFreshAccount(): boolean {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this._createdAt > dayAgo;
  }

  /**
   * Get mutual followers with another user
   */
  public getMutualFollowerIds(otherUser: User): string[] {
    const mutual: string[] = [];
    for (const followerId of this._followerIds) {
      if (otherUser._followerIds.has(followerId)) {
        mutual.push(followerId);
      }
    }
    return mutual;
  }

  /**
   * Enhanced follow method with business rules
   */
  public followUser(targetUser: User): void {
    this.canPerformAction(true); // Require email verification

    if (targetUser.id === this._id) {
      throw new CannotFollowSelfException();
    }

    if (this._followingIds.has(targetUser.id)) {
      throw new AlreadyFollowingUserException(targetUser.username);
    }

    if (this.hasReachedFollowingLimit()) {
      throw new DomainException('Following limit reached');
    }

    // Business rule: Fresh accounts can only follow 20 users per day
    if (this.isFreshAccount() && this._followingIds.size >= 20) {
      throw new DomainException(
        'New accounts are limited to 20 follows per day',
      );
    }

    this._followingIds.add(targetUser.id);
    targetUser.addFollower(this._id);
    this._updatedAt = new Date();

    this.addDomainEvent(new UserFollowedEvent(this._id, targetUser.id));
  }

  /**
   * Enhanced unfollow method
   */
  public unfollowUser(targetUser: User): void {
    this.canPerformAction();

    if (!this._followingIds.has(targetUser.id)) {
      throw new NotFollowingUserException(targetUser.username);
    }

    this._followingIds.delete(targetUser.id);
    targetUser.removeFollower(this._id);
    this._updatedAt = new Date();

    this.addDomainEvent(new UserUnfollowedEvent(this._id, targetUser.id));
  }

  /**
   * Update user password
   */
  public updatePassword(hashedPassword: string): void {
    if (!hashedPassword || hashedPassword.length === 0) {
      throw new DomainException('Password hash cannot be empty');
    }

    this._passwordHash = hashedPassword;
    this._updatedAt = new Date();
  }

  /**
   * Update last profile update timestamp (temporary method for verification email tracking)
   */
  public updateLastProfileUpdateTimestamp(timestamp: Date): void {
    this._lastProfileUpdate = timestamp;
    this._updatedAt = new Date();
  }

  /**
   * Get user statistics with enhanced metrics
   */
  public getStats() {
    return {
      followingCount: this.followingCount,
      followersCount: this.followersCount,
      isProfileComplete: this._profile.isComplete(),
      isEmailVerified: this._isEmailVerified,
      isVerified: this.isVerifiedUser(),
      isPopular: this.isPopularUser(),
      isFresh: this.isFreshAccount(),
      accountAge: Math.floor(
        (Date.now() - this._createdAt.getTime()) / (1000 * 60 * 60 * 24),
      ),
      canCreatePost: this.canCreatePost(),
      canComment: this.canComment(),
      canModerate: this.canModerate(),
      hasReachedFollowingLimit: this.hasReachedFollowingLimit(),
    };
  }

  /**
   * Domain invariant validation
   */
  public validate(): void {
    if (!this._username || this._username.length === 0) {
      throw new DomainException('Username is required');
    }

    if (!this._email || this._email.length === 0) {
      throw new DomainException('Email is required');
    }

    if (this._followingIds.size > 10000) {
      throw new DomainException('Following count exceeds maximum limit');
    }

    // Profile validation is done in UserProfile value object constructor
  }
}
