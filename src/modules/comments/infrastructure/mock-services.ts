import { Injectable } from '@nestjs/common';

export interface UserService {
  exists(userId: string): Promise<boolean>;
  isAdmin(userId: string): Promise<boolean>;
}

@Injectable()
export class MockUserService implements UserService {
  async exists(userId: string): Promise<boolean> {
    // Mock implementation - always return true
    return true;
  }

  async isAdmin(userId: string): Promise<boolean> {
    // Mock implementation - always return false
    return false;
  }
}

export interface PostService {
  exists(postId: string): Promise<boolean>;
}

@Injectable()
export class MockPostService implements PostService {
  async exists(postId: string): Promise<boolean> {
    // Mock implementation - always return true
    return true;
  }
}
