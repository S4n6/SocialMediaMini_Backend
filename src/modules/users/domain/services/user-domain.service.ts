import { User } from '../user.entity';
import { IUserRepository } from '../repositories';
import { UserId, UserEmail, Username } from '../value-objects';
import {
  UsernameAlreadyExistsException,
  EmailAlreadyExistsException,
} from '../user.exceptions';

/**
 * User Domain Service
 * Handles complex business logic that doesn't belong to a single aggregate
 */
export class UserDomainService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Check if user can be created with given email and username
   */
  async validateUserUniqueness(
    email: UserEmail,
    username: Username,
  ): Promise<void> {
    const [existingUserByEmail, existingUserByUsername] = await Promise.all([
      this.userRepository.findByEmail(email),
      this.userRepository.findByUsername(username),
    ]);

    if (existingUserByEmail) {
      throw new EmailAlreadyExistsException(email.getValue());
    }

    if (existingUserByUsername) {
      throw new UsernameAlreadyExistsException(username.getValue());
    }
  }

  /**
   * Validate follow business rules
   */
  async validateFollowRules(follower: User, followee: User): Promise<void> {
    // Business rule: User cannot follow themselves
    if (follower.id === followee.id) {
      throw new Error('User cannot follow themselves');
    }

    // Business rule: Check if already following
    if (follower.isFollowing(followee.id)) {
      throw new Error(`Already following user ${followee.username}`);
    }

    // Business rule: Check if followee account is active
    if (followee.status !== 'ACTIVE') {
      throw new Error('Cannot follow inactive user account');
    }

    // Business rule: Check follower limits (example: max 5000 following)
    if (follower.followingCount >= 5000) {
      throw new Error('Maximum following limit reached');
    }
  }

  /**
   * Validate unfollow business rules
   */
  validateUnfollowRules(follower: User, followee: User): void {
    // Business rule: Cannot unfollow if not following
    if (!follower.isFollowing(followee.id)) {
      throw new Error(`Not following user ${followee.username}`);
    }
  }

  /**
   * Calculate user interaction score (for recommendations, etc.)
   */
  calculateUserInteractionScore(user1: User, user2: User): number {
    let score = 0;

    // Mutual followers boost
    const mutualFollowersCount = this.calculateMutualFollowersCount(
      user1,
      user2,
    );
    score += mutualFollowersCount * 2;

    // Same creation timeframe (users who joined around same time)
    const daysDifference =
      Math.abs(user1.createdAt.getTime() - user2.createdAt.getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysDifference <= 30) {
      score += 5;
    }

    return score;
  }

  /**
   * Check if users have mutual followers
   */
  private calculateMutualFollowersCount(user1: User, user2: User): number {
    const user1Followers = new Set(user1.followerIds);
    const user2Followers = new Set(user2.followerIds);

    let mutualCount = 0;
    for (const followerId of user1Followers) {
      if (user2Followers.has(followerId)) {
        mutualCount++;
      }
    }

    return mutualCount;
  }

  /**
   * Generate username suggestions based on display name
   */
  async generateUsernameSuggestions(displayName: string): Promise<string[]> {
    const baseUsername = this.sanitizeDisplayNameForUsername(displayName);
    const suggestions: string[] = [];

    // Try base username
    if (
      !(await this.userRepository.existsByUsername(
        Username.create(baseUsername),
      ))
    ) {
      suggestions.push(baseUsername);
    }

    // Generate variations
    for (let i = 1; i <= 5; i++) {
      const variation = `${baseUsername}${i}`;
      if (
        !(await this.userRepository.existsByUsername(
          Username.create(variation),
        ))
      ) {
        suggestions.push(variation);
      }
    }

    // Generate with year
    const currentYear = new Date().getFullYear();
    const withYear = `${baseUsername}${currentYear}`;
    if (
      !(await this.userRepository.existsByUsername(Username.create(withYear)))
    ) {
      suggestions.push(withYear);
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  /**
   * Sanitize display name to create a valid username
   */
  private sanitizeDisplayNameForUsername(displayName: string): string {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove special characters
      .substring(0, 20); // Limit length
  }

  /**
   * Check if user can update profile (rate limiting)
   */
  canUpdateProfile(user: User): boolean {
    if (!user.lastProfileUpdate) {
      return true;
    }

    // Allow profile update once per day
    const daysSinceLastUpdate =
      (Date.now() - user.lastProfileUpdate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastUpdate >= 1;
  }
}
