import { Conversation, Message } from '../domain';

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByParticipants(participantIds: string[]): Promise<Conversation[]>;
  findByUserId(userId: string): Promise<Conversation[]>;
  create(conversation: Conversation): Promise<void>;
  update(conversation: Conversation): Promise<void>;
  delete(id: string): Promise<void>;
  existsWithParticipants(participantIds: string[]): Promise<boolean>;
}

export interface MessageRepository {
  findById(id: string): Promise<Message | null>;
  findByConversationId(
    conversationId: string,
    limit?: number,
    offset?: number,
  ): Promise<Message[]>;
  findUnreadByUserId(userId: string): Promise<Message[]>;
  findUnreadByConversationId(
    conversationId: string,
    userId: string,
  ): Promise<Message[]>;
  create(message: Message): Promise<void>;
  update(message: Message): Promise<void>;
  delete(id: string): Promise<void>;
  markAsDelivered(messageIds: string[]): Promise<void>;
  markAsRead(messageIds: string[], userId: string): Promise<void>;
  getConversationMessageCount(conversationId: string): Promise<number>;
  searchMessages(
    query: string,
    userId: string,
    limit?: number,
  ): Promise<Message[]>;
}
