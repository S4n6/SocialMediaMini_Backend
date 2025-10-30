// Application-level Conversation DTOs (not tied to HTTP)
export interface ConversationDto {
  id: string;
  type: string;
  title?: string;
  description?: string;
  avatarUrl?: string;
  participants: ConversationParticipantDto[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  lastActivityAt: string;
  isArchived: boolean;
  unreadCount: number;
  settings?: ConversationSettingsDto;
}

export interface ConversationParticipantDto {
  userId: string;
  role: string;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
}

export interface ConversationSettingsDto {
  isEncrypted?: boolean;
  allowNotifications?: boolean;
  muteUntil?: string;
  autoDeleteMessages?: boolean;
  autoDeleteDuration?: number;
  maxParticipants?: number;
  allowInviteLinks?: boolean;
  adminOnlyMessaging?: boolean;
}

export interface CreateConversationDto {
  type: string;
  participantIds: string[];
  title?: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  settings?: ConversationSettingsDto;
}

export interface UpdateConversationDto {
  title?: string;
  description?: string;
  avatarUrl?: string;
  settings?: Partial<ConversationSettingsDto>;
}

export interface ConversationSummaryDto {
  id: string;
  type: string;
  title?: string;
  participantCount: number;
  isActive: boolean;
  lastActivity: string;
  unreadCount: number;
  lastMessage?: {
    content: string;
    sentAt: string;
    senderId: string;
  };
}

export interface PaginatedConversationsDto {
  conversations: ConversationDto[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
