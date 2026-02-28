import { PostPrivacy, ReactionType } from '../../domain/entities/post.entity';

// ===== USE CASE INPUT DTOs =====
// Pure data contracts — no validation decorators.
// Validation is handled at the presentation layer.

export class CreatePostMediaDto {
  url: string;
  type: 'image' | 'video';
  order: number;
  s3Key?: string;
}

export class CreatePostDto {
  content?: string;
  privacy: PostPrivacy;
  media?: CreatePostMediaDto[];
  hashtags?: string[];
  authorId: string;
}

export class UpdatePostDto {
  content?: string;
  privacy?: PostPrivacy;
  media?: CreatePostMediaDto[];
  hashtags?: string[];
}

export class GetPostsQueryDto {
  page?: number;
  limit?: number;
  authorId?: string;
  privacy?: PostPrivacy;
  hashtag?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_commented';
}

export class GetTimelineFeedDto {
  cursor?: string | null;
  limit?: number;
  algorithm?: 'chronological' | 'smart' | 'diversified';
}

// ===== RESPONSE DTOs =====

export class PostMediaResponseDto {
  id: string;
  url: string;
  type: 'image' | 'video';
  order: number;
}

export class PostReactionResponseDto {
  id: string;
  type: ReactionType;
  userId: string;
  userFullName: string;
  userAvatar?: string;
  createdAt: Date;
}

export class PostCommentResponseDto {
  id: string;
  content: string;
  authorId: string;
  authorFullName: string;
  authorAvatar?: string;
  parentId?: string;
  repliesCount: number;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PostAuthorResponseDto {
  id: string;
  fullName: string;
  username: string;
  avatar?: string;
}

export class PostResponseDto {
  id: string;
  content?: string;
  privacy: PostPrivacy;
  author: PostAuthorResponseDto;
  media: PostMediaResponseDto[];
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PostDetailResponseDto extends PostResponseDto {
  comments: PostCommentResponseDto[];
  reactions: PostReactionResponseDto[];
}

export class PostListResponseDto {
  posts: PostResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Cursor-paginated response DTO for infinite scroll feeds.
 * `nextCursor` is null when the client has reached the end.
 */
export class CursorPaginatedPostsResponseDto {
  data: PostResponseDto[];
  nextCursor: string | null;
  hasNextPage: boolean;
}
