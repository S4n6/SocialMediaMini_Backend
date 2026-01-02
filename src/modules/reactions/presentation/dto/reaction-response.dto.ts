export interface ReactionResponseDto {
  id: string;
  type: string;
  reactorId: string;
  postId?: string | null;
  commentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  reactor?: {
    id: string;
    fullName: string;
    avatar: string | null;
  };
}

export interface CreateReactionResponseDto {
  message: string;
  reacted: boolean;
  reaction: ReactionResponseDto;
  isNew?: boolean;
}

export interface PostReactionsResponseDto {
  postId: string;
  totalReactions: number;
  reactions: Array<{
    reaction: ReactionResponseDto;
    reactor: {
      id: string;
      fullName: string;
      avatar: string | null;
    };
  }>;
}

export interface ReactionStatusResponseDto {
  targetId: string;
  userId: string;
  reacted: boolean;
  reactionId?: string | null;
  reactionType?: string | null;
}

export interface ReactionStatsResponseDto {
  targetId: string;
  targetType: string;
  totalReactions: number;
  reactionCounts: {
    LIKE: number;
    LOVE: number;
    HAHA: number;
    WOW: number;
    SAD: number;
    ANGRY: number;
  };
  topReactions: Array<{
    type: string;
    count: number;
  }>;
  lastUpdated: Date;
}

export interface BulkReactionResponseDto {
  successful: ReactionResponseDto[];
  failed: Array<{ targetId: string; error: string }>;
  stats: {
    total: number;
    successful: number;
    failed: number;
  };
}
