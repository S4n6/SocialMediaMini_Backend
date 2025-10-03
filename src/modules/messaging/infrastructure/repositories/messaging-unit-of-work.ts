import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  IMessagingUnitOfWork,
  IConversationRepository,
  IMessageRepository,
} from '../../domain/repositories';
import { ConversationRepositoryImpl } from './conversation.repository';
import { MessageRepositoryImpl } from './message.repository';

@Injectable()
export class MessagingUnitOfWorkImpl implements IMessagingUnitOfWork {
  private _conversations: IConversationRepository;
  private _messages: IMessageRepository;

  constructor(private readonly prisma: PrismaService) {
    this._conversations = new ConversationRepositoryImpl(this.prisma);
    this._messages = new MessageRepositoryImpl(this.prisma);
  }

  get conversations(): IConversationRepository {
    return this._conversations;
  }

  get messages(): IMessageRepository {
    return this._messages;
  }

  commit(): Promise<void> {
    // In a real implementation, this would commit a database transaction
    // For now, there's nothing to await because we use Prisma's implicit transactions
    return Promise.resolve();
  }

  rollback(): Promise<void> {
    // In a real implementation, this would rollback a database transaction
    // Throw an error to indicate rollback is not implemented with current Prisma setup
    return Promise.reject(
      new Error(
        'Transaction rollback not implemented with current Prisma setup',
      ),
    );
  }
}
