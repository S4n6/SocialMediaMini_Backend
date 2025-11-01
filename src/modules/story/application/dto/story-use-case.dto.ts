/**
 * Story Use Case DTOs
 *
 * These DTOs are used internally by use cases and application services
 * for business logic orchestration. They should not be exposed to
 * the presentation layer directly.
 */

// ========== COMMAND DTOs ==========

export interface CreateStoryCommand {
  authorId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
}

export interface ViewStoryCommand {
  storyId: string;
  viewerId: string;
}

export interface DeleteStoryCommand {
  storyId: string;
  userId: string;
}

// ========== QUERY DTOs ==========

export interface GetStoryByIdQuery {
  storyId: string;
  userId?: string;
}

export interface GetUserStoriesQuery {
  userId: string;
  currentUserId?: string;
}

export interface GetFollowedUsersStoriesQuery {
  currentUserId: string;
}

export interface GetStoryViewersQuery {
  storyId: string;
  authorId: string;
}

// ========== RESULT DTOs ==========

export interface StoryUseCaseResult {
  id: string;
  authorId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  hasViewed: boolean;
  // Author info
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface StoryViewResult {
  id: string;
  storyId: string;
  viewerId: string;
  viewedAt: Date;
  // Viewer info
  viewer: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface StoriesListResult {
  items: StoryUseCaseResult[];
  total: number;
}

export interface StoryViewersResult {
  viewers: StoryViewResult[];
  total: number;
}
