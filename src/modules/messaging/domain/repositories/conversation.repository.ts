import { Conversation } from '../entities/conversation.entity';
import { ConversationId, UserId } from '../value-objects';

export interface IConversationRepository {
  save(conversation: Conversation): Promise<void>;
  findById(id: ConversationId): Promise<Conversation | null>;
  findByParticipants(participantIds: UserId[]): Promise<Conversation[]>;
  findByParticipant(participantId: UserId): Promise<Conversation[]>;
  update(conversation: Conversation): Promise<void>;
  delete(id: ConversationId): Promise<void>;
  exists(id: ConversationId): Promise<boolean>;
}
