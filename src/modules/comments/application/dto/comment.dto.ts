import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content must be at least 1 character' })
  @MaxLength(1000, { message: 'Content cannot exceed 1000 characters' })
  content: string;

  @IsUUID('4', { message: 'Post ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Post ID is required' })
  postId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content must be at least 1 character' })
  @MaxLength(1000, { message: 'Content cannot exceed 1000 characters' })
  content: string;
}

export class AddCommentReactionDto {
  @IsString()
  @IsNotEmpty({ message: 'Reaction type is required' })
  @IsIn(['like', 'love', 'laugh', 'angry', 'sad'], {
    message: 'Reaction type must be one of: like, love, laugh, angry, sad',
  })
  reactionType: string;
}

export class GetCommentsDto {
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  page?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @IsIn(['newest', 'oldest', 'popular'], {
    message: 'Sort by must be one of: newest, oldest, popular',
  })
  sortBy?: 'newest' | 'oldest' | 'popular' = 'newest';
}

export class GetRepliesDto {
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  page?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  limit?: number = 10;
}

export class CommentResponseDto {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
  isReply: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Optional populated data
  author?: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
  };

  reactions?: {
    [key: string]: number;
  };

  replyCount?: number;
  userReaction?: string | null;
}

export class CommentWithRepliesDto extends CommentResponseDto {
  replies: {
    items: CommentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class CommentPaginationDto {
  items: CommentResponseDto[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class PaginatedCommentsResponseDto {
  items: CommentResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ReactionToggleResponseDto {
  commentId: string;
  reactionType: string;
  added: boolean;
  newCount: number;
}
