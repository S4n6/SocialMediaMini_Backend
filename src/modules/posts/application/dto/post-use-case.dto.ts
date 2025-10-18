import { PostPrivacy, ReactionType } from '../../domain/post.entity';

// ===== USE CASE INPUT DTOs =====
// These DTOs are used for use case inputs/outputs and business logic
// No validation decorators - validation handled at presentation layer

export class CreatePostMediaDto {
  url: string;
  type: 'image' | 'video';
  order: number;
}

export class CreatePostDto {
  content?: string;
  privacy: PostPrivacy;
  media?: CreatePostMediaDto[];
  hashtags?: string[];
  authorId: string;
}

export class UpdatePostDto {
  id: string;
  content?: string;
  privacy?: PostPrivacy;
  media?: CreatePostMediaDto[];
  hashtags?: string[];
  authorId: string; // For authorization check
}

export class GetPostsQueryDto {
  page: number;
  limit: number;
  authorId?: string;
  privacy?: PostPrivacy;
  hashtag?: string;
  search?: string;
  sortBy: 'newest' | 'oldest' | 'most_liked' | 'most_commented';
}

export class GetUserPostsDto {
  userId: string;
  requesterId?: string; // For privacy filtering
  page: number;
  limit: number;
}

// ===== USE CASE OUTPUT DTOs =====

export class PostStatsDto {
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

export class PostMediaDto {
  id: string;
  url: string;
  type: 'image' | 'video';
  order: number;
  createdAt: Date;
}

export class PostAuthorDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified: boolean;
}

export class PostReactionDto {
  id: string;
  type: ReactionType;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  createdAt: Date;
}

export class PostCommentDto {
  id: string;
  content: string;
  author: PostAuthorDto;
  parentId?: string;
  replies: PostCommentDto[];
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PostResponseDto {
  id: string;
  content?: string;
  privacy: PostPrivacy;
  author: PostAuthorDto;
  media: PostMediaDto[];
  hashtags: string[];
  stats: PostStatsDto;
  reactions: PostReactionDto[];
  comments: PostCommentDto[];
  userReaction?: ReactionType;
  isFollowing: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PostListResponseDto {
  posts: PostResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search DTOs
export class SearchPostsDto {
  query: string;
  filters: {
    authorId?: string;
    hashtag?: string;
    privacy?: PostPrivacy;
    dateFrom?: Date;
    dateTo?: Date;
  };
  page: number;
  limit: number;
  requesterId?: string; // For privacy filtering
}

// Feed DTOs
export class GetUserFeedDto {
  userId: string;
  page: number;
  limit: number;
}

export class GetTrendingPostsDto {
  page: number;
  limit: number;
  timeframe?: 'hour' | 'day' | 'week' | 'month';
}
