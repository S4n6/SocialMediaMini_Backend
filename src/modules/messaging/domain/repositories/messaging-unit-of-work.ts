import { IConversationRepository } from './conversation.repository';
import { IMessageRepository } from './message.repository';

export interface IMessagingUnitOfWork {
  conversations: IConversationRepository;
  messages: IMessageRepository;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
