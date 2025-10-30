import { Message } from '../entities/message.entity';
import { ConversationId, MessageId, UserId } from '../value-objects';

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
