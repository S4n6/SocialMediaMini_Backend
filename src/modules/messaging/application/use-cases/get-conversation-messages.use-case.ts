import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IMessageRepository,
  IConversationRepository,
  MessagingValidationService,
  Message,
  ConversationId,
  MessageId,
  UserId,
} from '../../domain';

export interface GetConversationMessagesQuery {
  conversationId: string;
  userId: string;
  limit?: number;
  cursor?: string;
}

export interface GetConversationMessagesResult {
  messages: Message[];
  hasMore: boolean;
  nextCursor?: string;
}

@Injectable()
export class GetConversationMessagesUseCase {
  constructor(
    @Inject(MESSAGING_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGING_TOKENS.MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    @Inject(MESSAGING_TOKENS.MESSAGING_VALIDATION_SERVICE)
    private readonly validationService: MessagingValidationService,
  ) {}

  async execute(
    query: GetConversationMessagesQuery,
  ): Promise<GetConversationMessagesResult> {
    const conversationId = ConversationId.fromString(query.conversationId);
    const userId = UserId.fromString(query.userId);

    // Validate conversation exists and user has access
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.validationService.validateConversationAccess(
      conversation,
      userId,
      'read',
    );

    const cursor = query.cursor
      ? MessageId.fromString(query.cursor)
      : undefined;
    const result = await this.messageRepository.findByConversationIdPaginated(
      conversationId,
      cursor,
      query.limit || 50,
    );

    return {
      messages: result.messages,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor?.value,
    };
  }
}
