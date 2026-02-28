export interface IExternalPostService {
  findById(
    postId: string,
  ): Promise<{ id: string; authorId: string; content: string } | null>;
}

export interface IExternalCommentService {
  findById(
    commentId: string,
  ): Promise<{ id: string; authorId: string; content: string } | null>;
}

export interface IExternalUserService {
  findById(
    userId: string,
  ): Promise<{ id: string; fullName: string; avatar: string | null } | null>;
}

export interface INotificationService {
  createReactionNotification(data: {
    reactorId: string;
    targetUserId: string;
    entityId: string;
    entityType: 'post' | 'comment';
    content: string;
  }): Promise<void>;
}
