// Message Application DTOs
export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string | null;
  content: string;
  type: string;
  status: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  editedAt?: string;
  attachmentUrl?: string;
  replyToMessageId?: string;
  reactions: Array<{ emoji: string; userIds: string[] }>;
}

export interface CreateMessageDto {
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  attachmentUrl?: string;
  replyToMessageId?: string;
}

export interface UpdateMessageDto {
  content?: string;
  status?: string;
}

export interface MessageReactionDto {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface PaginatedMessagesDto {
  messages: MessageDto[];
  hasMore: boolean;
  nextCursor?: string;
  total?: number;
}
