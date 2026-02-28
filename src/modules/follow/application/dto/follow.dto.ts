/**
 * Application Layer DTOs - Plain interfaces
 * Validation is handled in the Presentation layer
 */

export interface FollowUserDto {
  userId: string;
}

export interface GetFollowsQuery {
  followerId?: string;
  followingId?: string;
  limit?: number;
  offset?: number;
}
