import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { ConversationId, MessageId, UserId } from './value-objects';

export interface IConversationRepository {
  save(conversation: Conversation): Promise<void>;
  findById(id: ConversationId): Promise<Conversation | null>;
  findByParticipants(participantIds: UserId[]): Promise<Conversation[]>;
  findByParticipant(participantId: UserId): Promise<Conversation[]>;
  update(conversation: Conversation): Promise<void>;
  delete(id: ConversationId): Promise<void>;
  exists(id: ConversationId): Promise<boolean>;
}

export interface IMessageRepository {
  save(message: Message): Promise<void>;
  findById(id: MessageId): Promise<Message | null>;
  findByConversationId(
    conversationId: ConversationId,
    limit?: number,
    offset?: number,
  ): Promise<Message[]>;
  findByConversationIdPaginated(
    conversationId: ConversationId,
    cursor?: MessageId,
    limit?: number,
  ): Promise<{
    messages: Message[];
    hasMore: boolean;
    nextCursor?: MessageId;
  }>;
  update(message: Message): Promise<void>;
  delete(id: MessageId): Promise<void>;
  markAsDelivered(messageId: MessageId, deliveredAt: Date): Promise<void>;
  markAsRead(messageId: MessageId, readAt: Date): Promise<void>;
  countUnreadMessages(
    conversationId: ConversationId,
    userId: UserId,
  ): Promise<number>;
  getLastMessage(conversationId: ConversationId): Promise<Message | null>;
  exists(id: MessageId): Promise<boolean>;
}

export interface IMessagingUnitOfWork {
  conversations: IConversationRepository;
  messages: IMessageRepository;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
