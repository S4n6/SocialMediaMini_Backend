import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PostPrivacy, ReactionType } from '../../domain/post.entity';
import { Type } from 'class-transformer';

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
  authorId: string; // Added for use case context
}

// ===== UPDATE POST DTOs =====

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Post content cannot exceed 2000 characters' })
  content?: string;

  @IsOptional()
  @IsEnum(PostPrivacy)
  privacy?: PostPrivacy;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePostMediaDto)
  media?: CreatePostMediaDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];
}

// ===== QUERY DTOs =====

export class GetPostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsEnum(PostPrivacy)
  privacy?: PostPrivacy;

  @IsOptional()
  @IsString()
  hashtag?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['newest', 'oldest', 'most_liked', 'most_commented'])
  sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_commented' = 'newest';
}

export class GetUserPostsDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

// ===== REACTION DTOs =====

export class CreateReactionDto {
  @IsEnum(ReactionType)
  type: ReactionType;
}

export class RemoveReactionDto {
  // No additional fields needed - postId and userId from params/auth
}

// ===== COMMENT DTOs =====

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  content: string;
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
  isLikedByCurrentUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class PostAuthorResponseDto {
  id: string;
  fullName: string;
  username: string;
  avatar?: string;
  isFollowedByCurrentUser?: boolean;
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
  isLikedByCurrentUser?: boolean;
  currentUserReaction?: ReactionType;
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

// ===== STATISTICS DTOs =====

export class PostStatsResponseDto {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  postsThisMonth: number;
  topHashtags: Array<{
    hashtag: string;
    count: number;
  }>;
  engagementRate: number;
}

// ===== FEED DTOs =====

export class GetFeedDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['timeline', 'following', 'trending'])
  feedType?: 'timeline' | 'following' | 'trending' = 'timeline';
}
