import { Injectable } from '@nestjs/common';
import { IUserAdapter } from '../../application/ports/i-user.adapter';

/**
 * User Service Adapter for Posts Domain
 * Implements the adapter pattern to interact with User module
 * This isolates Posts domain from User module implementation details
 */
@Injectable()
export class UserServiceAdapter implements IUserAdapter {
  constructor() // private readonly userService: UserService, // TODO: Inject UserService when available
  {}

  async getUserById(userId: string): Promise<{
    id: string;
    fullName: string;
    username: string;
    avatar?: string;
  } | null> {
    // TODO: Replace with actual UserService call
    // return this.userService.findById(userId);

    // Mock implementation for now
    if (!userId) return null;

    return {
      id: userId,
      fullName: `User ${userId.substring(0, 8)}`,
      username: `@user${userId.substring(0, 4)}`,
      avatar: undefined,
    };
  }

  async getUsersByIds(userIds: string[]): Promise<
    Array<{
      id: string;
      fullName: string;
      username: string;
      avatar?: string;
    }>
  > {
    // TODO: Replace with actual UserService batch call
    // return this.userService.findByIds(userIds);

    // Mock implementation for now
    return userIds.map((userId) => ({
      id: userId,
      fullName: `User ${userId.substring(0, 8)}`,
      username: `@user${userId.substring(0, 4)}`,
      avatar: undefined,
    }));
  }

  async userExists(userId: string): Promise<boolean> {
    // TODO: Replace with actual UserService call
    // return this.userService.exists(userId);

    // Mock implementation - assume user exists if ID is provided
    return Boolean(userId);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    // TODO: Replace with actual FollowService call
    // return this.followService.isFollowing(followerId, followingId);

    // Mock implementation - return false for now
    return false;
  }

  async getFollowerIds(userId: string): Promise<string[]> {
    // TODO: Replace with actual FollowService call
    // return this.followService.getFollowerIds(userId);

    // Mock implementation - return empty array
    return [];
  }

  async getFollowingIds(userId: string): Promise<string[]> {
    // TODO: Replace with actual FollowService call
    // return this.followService.getFollowingIds(userId);

    // Mock implementation - return some mock following IDs
    return ['mock-user-1', 'mock-user-2', 'mock-user-3'];
  }
}
