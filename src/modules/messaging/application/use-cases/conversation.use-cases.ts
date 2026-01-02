import { Injectable } from '@nestjs/common';
import {
  CreatePrivateConversationUseCase,
  CreateGroupConversationUseCase,
  GetUserConversationsUseCase,
  ManageParticipantsUseCase,
} from './index';

/**
 * Aggregated Conversation Use Cases Service
 * This provides a unified interface for all conversation-related operations
 */
@Injectable()
export class ConversationUseCases {
  constructor(
    private readonly createPrivateConversationUseCase: CreatePrivateConversationUseCase,
    private readonly createGroupConversationUseCase: CreateGroupConversationUseCase,
    private readonly getUserConversationsUseCase: GetUserConversationsUseCase,
    private readonly manageParticipantsUseCase: ManageParticipantsUseCase,
  ) {}

  async createPrivateConversation(command: {
    participantIds: string[];
    createdBy: string;
  }): Promise<string> {
    // Ensure exactly 2 participants for private conversation
    if (command.participantIds.length !== 2) {
      throw new Error('Private conversation must have exactly 2 participants');
    }

    const result = await this.createPrivateConversationUseCase.execute({
      participantIds: [
        command.participantIds[0],
        command.participantIds[1],
      ] as [string, string],
      createdBy: command.createdBy,
    });
    return result.conversationId;
  }

  async createGroupConversation(command: {
    title: string;
    participantIds: string[];
    createdBy: string;
  }): Promise<string> {
    const result = await this.createGroupConversationUseCase.execute(command);
    return result.conversationId;
  }

  async getUserConversations(query: { userId: string }): Promise<any[]> {
    const result = await this.getUserConversationsUseCase.execute(query);
    return result.conversations;
  }

  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<any | null> {
    try {
      // This would need to be a separate use case, for now simulate
      const conversations = await this.getUserConversations({ userId });
      const conversation = conversations.find(
        (c) => c.id.value === conversationId,
      );
      return conversation || null;
    } catch (error) {
      return null;
    }
  }

  async addParticipant(command: {
    conversationId: string;
    userId: string;
    addedBy: string;
  }): Promise<void> {
    await this.manageParticipantsUseCase.addParticipant({
      conversationId: command.conversationId,
      userId: command.userId,
      addedBy: command.addedBy,
    });
  }

  async removeParticipant(command: {
    conversationId: string;
    userId: string;
    removedBy: string;
  }): Promise<void> {
    await this.manageParticipantsUseCase.removeParticipant({
      conversationId: command.conversationId,
      userId: command.userId,
      removedBy: command.removedBy,
    });
  }

  async updateConversationTitle(command: {
    conversationId: string;
    title: string;
    updatedBy: string;
  }): Promise<void> {
    // This would need to be implemented as a separate use case
    // For now, just log the action
    console.log(
      `Update conversation ${command.conversationId} title to: ${command.title}`,
    );
  }

  async archiveConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // This would need to be implemented as a separate use case
    console.log(`Archive conversation ${conversationId} for user ${userId}`);
  }

  async unarchiveConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // This would need to be implemented as a separate use case
    console.log(`Unarchive conversation ${conversationId} for user ${userId}`);
  }
}
