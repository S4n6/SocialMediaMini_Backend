import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  ValidateNested,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

// Post subscription DTOs
export class SubscribePostDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  postId: string;
}

export class UnsubscribePostDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  postId: string;
}

export class SubscribeFeedDto {
  @IsOptional()
  @IsString()
  feedType?: 'timeline' | 'explore' | 'following' = 'timeline';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];
}

// Reaction DTOs
export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  LAUGH = 'LAUGH',
  ANGRY = 'ANGRY',
  SAD = 'SAD',
}

export class ReactPostDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  postId: string;

  @IsEnum(ReactionType)
  reactionType: ReactionType;
}

export class UnreactPostDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  postId: string;
}

// Comment DTOs
export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  postId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  commentId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class DeleteCommentDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  commentId: string;
}

// Response DTOs
export class PostReactionDto {
  @IsString()
  @IsUUID()
  id: string;

  @IsEnum(ReactionType)
  type: ReactionType;

  @IsString()
  @IsUUID()
  userId: string;

  @Type(() => Date)
  createdAt: Date;
}

export class PostCommentDto {
  @IsString()
  @IsUUID()
  id: string;

  @IsString()
  content: string;

  @IsString()
  @IsUUID()
  authorId: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  parentId?: string;

  @Type(() => Date)
  createdAt: Date;

  @Type(() => Date)
  updatedAt: Date;

  // Additional fields for WebSocket
  @IsOptional()
  authorName?: string;

  @IsOptional()
  authorAvatar?: string;
}

export class PostMediaDto {
  @IsString()
  @IsUUID()
  id: string;

  @IsString()
  url: string;

  @IsString()
  type: 'image' | 'video';

  @IsInt()
  @Min(0)
  order: number;
}

export class PostDto {
  @IsString()
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsString()
  privacy: string;

  @IsString()
  @IsUUID()
  authorId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaDto)
  media?: PostMediaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostReactionDto)
  reactions?: PostReactionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostCommentDto)
  comments?: PostCommentDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @Type(() => Date)
  createdAt: Date;

  @Type(() => Date)
  updatedAt: Date;

  // Additional fields for WebSocket
  @IsOptional()
  authorName?: string;

  @IsOptional()
  authorAvatar?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  likesCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  commentsCount?: number;

  @IsOptional()
  isLiked?: boolean;

  @IsOptional()
  userReaction?: ReactionType;
}

export class PostReactionUpdateDto {
  @IsString()
  @IsUUID()
  postId: string;

  @IsString()
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsEnum(ReactionType)
  reactionType?: ReactionType;

  @IsString()
  action: 'add' | 'remove' | 'update';

  @IsInt()
  @Min(0)
  totalReactions: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostReactionDto)
  reactions?: PostReactionDto[];
}

export class PostAnalyticsDto {
  @IsString()
  @IsUUID()
  postId: string;

  @IsInt()
  @Min(0)
  views: number;

  @IsInt()
  @Min(0)
  likes: number;

  @IsInt()
  @Min(0)
  comments: number;

  @IsInt()
  @Min(0)
  shares: number;

  @Type(() => Date)
  updatedAt: Date;
}
