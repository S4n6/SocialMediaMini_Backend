export interface ExternalPostService {
  findById(
    postId: string,
  ): Promise<{ id: string; authorId: string; content: string } | null>;
}

export interface ExternalCommentService {
  findById(
    commentId: string,
  ): Promise<{ id: string; authorId: string; content: string } | null>;
}

export interface NotificationService {
  createReactionNotification(data: {
    reactorId: string;
    targetUserId: string;
    entityId: string;
    entityType: 'post' | 'comment';
    content: string;
  }): Promise<void>;
}

export interface EventBus {
  publish(event: any): Promise<void>;
}
