import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===== RESPONSE DTOs =====

export class PostMediaResponseDto {
  @ApiProperty({ description: 'Media ID' })
  id: string;

  @ApiProperty({ description: 'Media URL' })
  url: string;

  @ApiProperty({ description: 'Media type', enum: ['image', 'video'] })
  type: 'image' | 'video';

  @ApiProperty({ description: 'Display order' })
  order: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}

export class PostAuthorResponseDto {
  @ApiProperty({ description: 'Author ID' })
  id: string;

  @ApiProperty({ description: 'Author username' })
  username: string;

  @ApiProperty({ description: 'Author display name' })
  displayName: string;

  @ApiPropertyOptional({ description: 'Author avatar URL' })
  avatarUrl?: string;

  @ApiProperty({ description: 'Is verified user' })
  isVerified: boolean;
}

export class PostStatsResponseDto {
  @ApiProperty({ description: 'Number of likes' })
  likesCount: number;

  @ApiProperty({ description: 'Number of comments' })
  commentsCount: number;

  @ApiProperty({ description: 'Number of shares' })
  sharesCount: number;
}

export class PostReactionResponseDto {
  @ApiProperty({ description: 'Reaction ID' })
  id: string;

  @ApiProperty({ description: 'Reaction type' })
  type: 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'SAD' | 'ANGRY';

  @ApiProperty({ description: 'User who reacted' })
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };

  @ApiProperty({ description: 'Reaction timestamp' })
  createdAt: Date;
}

export class PostCommentResponseDto {
  @ApiProperty({ description: 'Comment ID' })
  id: string;

  @ApiProperty({ description: 'Comment content' })
  content: string;

  @ApiProperty({ description: 'Comment author' })
  author: PostAuthorResponseDto;

  @ApiPropertyOptional({ description: 'Parent comment ID' })
  parentId?: string;

  @ApiProperty({ description: 'Comment replies' })
  replies: PostCommentResponseDto[];

  @ApiProperty({ description: 'Number of likes on comment' })
  likesCount: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class PostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Post content' })
  content?: string;

  @ApiProperty({
    description: 'Post privacy setting',
    enum: ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'],
  })
  privacy: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';

  @ApiProperty({ description: 'Post author information' })
  author: PostAuthorResponseDto;

  @ApiProperty({
    description: 'Media attachments',
    type: [PostMediaResponseDto],
  })
  media: PostMediaResponseDto[];

  @ApiProperty({
    description: 'Post hashtags',
    type: [String],
  })
  hashtags: string[];

  @ApiProperty({ description: 'Post statistics' })
  stats: PostStatsResponseDto;

  @ApiProperty({
    description: 'User reactions (limited)',
    type: [PostReactionResponseDto],
  })
  reactions: PostReactionResponseDto[];

  @ApiProperty({
    description: 'Recent comments (limited)',
    type: [PostCommentResponseDto],
  })
  comments: PostCommentResponseDto[];

  @ApiPropertyOptional({ description: 'Current user reaction type' })
  userReaction?: 'LIKE' | 'LOVE' | 'LAUGH' | 'WOW' | 'SAD' | 'ANGRY';

  @ApiProperty({ description: 'Is user following the author' })
  isFollowing: boolean;

  @ApiProperty({ description: 'Can current user edit this post' })
  canEdit: boolean;

  @ApiProperty({ description: 'Can current user delete this post' })
  canDelete: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class PostListResponseDto {
  @ApiProperty({
    description: 'List of posts',
    type: [PostResponseDto],
  })
  posts: PostResponseDto[];

  @ApiProperty({ description: 'Total number of posts' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;
}

export class PostStatsDetailResponseDto {
  @ApiProperty({ description: 'Post ID' })
  postId: string;

  @ApiProperty({ description: 'Detailed statistics' })
  stats: {
    likes: number;
    loves: number;
    laughs: number;
    wows: number;
    sads: number;
    angrys: number;
    comments: number;
    shares: number;
    views: number;
  };

  @ApiProperty({ description: 'Top reactions' })
  topReactions: Array<{
    type: string;
    count: number;
    users: Array<{
      id: string;
      username: string;
      avatarUrl?: string;
    }>;
  }>;
}

export class CreatePostResponseDto {
  @ApiProperty({ description: 'Created post information' })
  post: PostResponseDto;

  @ApiProperty({ description: 'Success message' })
  message: string;
}
