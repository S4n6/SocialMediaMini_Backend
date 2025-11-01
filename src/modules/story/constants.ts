/**
 * Story Module Constants
 */

// API Routes
export const STORY_ROUTES = {
  BASE: 'stories',
  CREATE: '',
  GET_FEED: 'feed',
  GET_USER_STORIES: 'user/:userId',
  VIEW_STORY: ':storyId/view',
  GET_STORY_VIEWERS: ':storyId/viewers',
  DELETE_STORY: ':storyId',
} as const;

// Story Types
export const STORY_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
} as const;

// Story Status
export const STORY_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  DELETED: 'deleted',
} as const;

// Validation Constants
export const STORY_VALIDATION = {
  CONTENT_MAX_LENGTH: 500,
  MEDIA_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  EXPIRES_IN_HOURS: 24,
} as const;

// Error Messages
export const STORY_ERROR_MESSAGES = {
  STORY_NOT_FOUND: 'Story not found',
  STORY_EXPIRED: 'Story has expired',
  INVALID_STORY_TYPE: 'Invalid story type',
  CONTENT_TOO_LONG: `Content must not exceed ${STORY_VALIDATION.CONTENT_MAX_LENGTH} characters`,
  CONTENT_OR_MEDIA_REQUIRED: 'Story must have either content or media',
  MEDIA_TYPE_REQUIRED: 'Media type is required when media URL is provided',
  UNAUTHORIZED_ACCESS: 'You are not authorized to access this story',
} as const;
