import { TargetType } from '../../../constants';

/**
 * Query for getting reactions with filters
 */
export interface GetReactionsQuery {
  // Target filters
  postId?: string;
  commentId?: string;
  targetType?: TargetType;

  // User filters
  reactorId?: string;
  reactorIds?: string[];

  // Reaction type filters
  reactionTypes?: string[];

  // Pagination
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;

  // Sorting
  sortBy?: 'createdAt' | 'updatedAt' | 'type';
  sortOrder?: 'asc' | 'desc';

  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;

  // Enrichment options
  includeReactor?: boolean;
  includeTarget?: boolean;
  includeMetadata?: boolean;
}

/**
 * Query for getting reaction statistics
 */
export interface GetReactionStatsQuery {
  targetId?: string;
  targetType?: TargetType;
  groupBy?: 'type' | 'date' | 'user';
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: Date;
  endDate?: Date;
}

/**
 * Query for getting user's reaction status
 */
export interface GetUserReactionStatusQuery {
  userId: string;
  targetId: string;
  targetType: TargetType;
  includeHistory?: boolean;
}

/**
 * Query for getting reactions with aggregation
 */
export interface GetReactionsWithAggregationQuery extends GetReactionsQuery {
  aggregations: {
    countByType?: boolean;
    countByUser?: boolean;
    countByDate?: boolean;
    mostPopularReaction?: boolean;
    recentReactions?: boolean;
  };
}
