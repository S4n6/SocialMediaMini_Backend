/**
 * Response DTOs for Story Controller
 *
 * These DTOs define the structure of HTTP responses sent to clients.
 * They should only contain data that's safe and appropriate for external consumption.
 */

// ========== STORY AUTHOR RESPONSE ==========

export interface StoryAuthorDto {
  id: string;
  username: string;
  avatar?: string;
}

// ========== STORY VIEWER RESPONSE ==========

export interface StoryViewerDto {
  id: string;
  username: string;
  avatar?: string;
  viewedAt: Date;
}

// ========== STORY RESPONSE ==========

export interface StoryResponseDto {
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

  // Optional populated data
  author?: StoryAuthorDto;
}

// ========== STORIES LIST RESPONSE ==========

export interface StoriesListResponseDto {
  items: StoryResponseDto[];
  total: number;
}

// ========== STORY VIEWERS RESPONSE ==========

export interface StoryViewersResponseDto {
  viewers: StoryViewerDto[];
  total: number;
}

// ========== API RESPONSE WRAPPER ==========

export interface ApiSuccessResponse<T = any> {
  statusCode: number;
  message: string;
  success: true;
  data: T;
  timestamp?: Date;
}
