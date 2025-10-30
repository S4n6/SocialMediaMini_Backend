import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IConversationRepository,
  Conversation,
  MessagingValidationService,
  ConversationId,
  UserId,
} from '../../domain';

export interface GetUserConversationsQuery {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface GetUserConversationsResult {
  conversations: Conversation[];
  total: number;
}

@Injectable()
export class GetUserConversationsUseCase {
  constructor(
    @Inject(MESSAGING_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGING_TOKENS.MESSAGING_VALIDATION_SERVICE)
    private readonly validationService: MessagingValidationService,
  ) {}

  async execute(
    query: GetUserConversationsQuery,
  ): Promise<GetUserConversationsResult> {
    const userId = UserId.fromString(query.userId);

    const conversations =
      await this.conversationRepository.findByParticipant(userId);

    // Filter only active conversations and user has access
    const accessibleConversations = conversations.filter((conversation) => {
      try {
        this.validationService.validateConversationAccess(
          conversation,
          userId,
          'read',
        );
        return conversation.isActive();
      } catch {
        return false;
      }
    });

    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const paginatedConversations = accessibleConversations.slice(
      offset,
      offset + limit,
    );

    return {
      conversations: paginatedConversations,
      total: accessibleConversations.length,
    };
  }
}
