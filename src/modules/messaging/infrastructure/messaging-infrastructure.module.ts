import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../database/prisma.module';
import { MESSAGING_TOKENS } from '../constants';
import { ConversationRepositoryImpl } from './repositories/conversation.repository';
import { MessageRepositoryImpl } from './repositories/message.repository';
import { MessagingUnitOfWorkImpl } from './repositories/messaging-unit-of-work';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: MESSAGING_TOKENS.CONVERSATION_REPOSITORY,
      useClass: ConversationRepositoryImpl,
    },
    {
      provide: MESSAGING_TOKENS.MESSAGE_REPOSITORY,
      useClass: MessageRepositoryImpl,
    },
    {
      provide: MESSAGING_TOKENS.MESSAGING_UNIT_OF_WORK,
      useClass: MessagingUnitOfWorkImpl,
    },
  ],
  exports: [
    MESSAGING_TOKENS.CONVERSATION_REPOSITORY,
    MESSAGING_TOKENS.MESSAGE_REPOSITORY,
    MESSAGING_TOKENS.MESSAGING_UNIT_OF_WORK,
  ],
})
export class MessagingInfrastructureModule {}
