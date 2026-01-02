import { ReactionType, TargetType } from '../../../constants';

/**
 * Command for creating a reaction
 * Internal application layer DTO
 */
export interface CreateReactionCommand {
  reactorId: string;
  targetId: string;
  targetType: TargetType;
  reactionType: ReactionType;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    timestamp: Date;
  };
}

/**
 * Command for updating a reaction
 */
export interface UpdateReactionCommand {
  reactionId: string;
  reactorId: string;
  newReactionType: ReactionType;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    timestamp: Date;
  };
}

/**
 * Command for deleting a reaction
 */
export interface DeleteReactionCommand {
  reactionId: string;
  reactorId: string;
  reason?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    timestamp: Date;
  };
}

/**
 * Batch command for multiple reactions
 */
export interface BatchReactionCommand {
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    data: CreateReactionCommand | UpdateReactionCommand | DeleteReactionCommand;
  }>;
  metadata?: {
    batchId: string;
    requestedBy: string;
    timestamp: Date;
  };
}
