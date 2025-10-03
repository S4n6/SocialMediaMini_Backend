import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma.module';
import { ConversationRepositoryImpl } from './repositories/conversation.repository';
import { MessageRepositoryImpl } from './repositories/message.repository';
import { MessagingUnitOfWorkImpl } from './repositories/messaging-unit-of-work';

// Repository tokens
export const CONVERSATION_REPOSITORY = 'CONVERSATION_REPOSITORY';
export const MESSAGE_REPOSITORY = 'MESSAGE_REPOSITORY';
export const MESSAGING_UNIT_OF_WORK = 'MESSAGING_UNIT_OF_WORK';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: CONVERSATION_REPOSITORY,
      useClass: ConversationRepositoryImpl,
    },
    {
      provide: MESSAGE_REPOSITORY,
      useClass: MessageRepositoryImpl,
    },
    {
      provide: MESSAGING_UNIT_OF_WORK,
      useClass: MessagingUnitOfWorkImpl,
    },
  ],
  exports: [
    CONVERSATION_REPOSITORY,
    MESSAGE_REPOSITORY,
    MESSAGING_UNIT_OF_WORK,
  ],
})
export class MessagingInfrastructureModule {}
