import { Injectable } from '@nestjs/common';
import { ConversationUseCases } from '../use-cases/conversation.use-cases';
import { MessageUseCases } from '../use-cases/message.use-cases';

@Injectable()
export class MessagingApplicationServices {
  constructor(
    private readonly conversationUseCases: ConversationUseCases,
    private readonly messageUseCases: MessageUseCases,
  ) {}

  // Convenience methods that combine multiple use cases or add business logic

  async startPrivateChat(userId1: string, userId2: string): Promise<string> {
    return await this.conversationUseCases.createPrivateConversation({
      participantIds: [userId1, userId2],
      createdBy: userId1,
    });
  }

  async createGroupChat(
    title: string,
    creatorId: string,
    memberIds: string[],
  ): Promise<string> {
    // Add creator to members if not already included
    const allParticipants = memberIds.includes(creatorId)
      ? memberIds
      : [creatorId, ...memberIds];

    return await this.conversationUseCases.createGroupConversation({
      title,
      participantIds: allParticipants,
      createdBy: creatorId,
    });
  }

  async sendQuickTextMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<string> {
    return await this.messageUseCases.sendTextMessage({
      conversationId,
      senderId,
      content,
    });
  }

  async getConversationWithMessages(
    conversationId: string,
    userId: string,
    messageLimit: number = 50,
  ): Promise<{
    conversation: any;
    messages: any[];
    hasMoreMessages: boolean;
    nextCursor?: string;
  }> {
    const conversation = await this.conversationUseCases.getConversationById(
      conversationId,
      userId,
    );

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const messageResult = await this.messageUseCases.getConversationMessages({
      conversationId,
      userId,
      limit: messageLimit,
    });

    return {
      conversation: conversation.toPrimitives(),
      messages: messageResult.messages.map((msg) => msg.toPrimitives()),
      hasMoreMessages: messageResult.hasMore,
      nextCursor: messageResult.nextCursor,
    };
  }

  async getUserConversationsWithLastMessage(userId: string): Promise<any[]> {
    const conversations = await this.conversationUseCases.getUserConversations({
      userId,
    });

    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await this.messageUseCases.getConversationMessages({
          conversationId: conversation.id.value,
          userId,
          limit: 1,
        });

        const unreadCount = await this.messageUseCases.getUnreadMessageCount(
          conversation.id.value,
          userId,
        );

        return {
          ...conversation.toPrimitives(),
          lastMessage: lastMessage.messages[0]?.toPrimitives() || null,
          unreadCount,
        };
      }),
    );

    // Sort by last message time or conversation updated time
    return conversationsWithLastMessage.sort((a, b) => {
      const aTime = a.lastMessage?.sentAt || a.updatedAt;
      const bTime = b.lastMessage?.sentAt || b.updatedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }

  async leaveGroupConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.conversationUseCases.removeParticipant({
      conversationId,
      userId,
      removedBy: userId,
    });
  }

  async inviteToGroupConversation(
    conversationId: string,
    newMemberIds: string[],
    invitedBy: string,
  ): Promise<void> {
    for (const memberId of newMemberIds) {
      await this.conversationUseCases.addParticipant({
        conversationId,
        userId: memberId,
        addedBy: invitedBy,
      });
    }
  }
}
