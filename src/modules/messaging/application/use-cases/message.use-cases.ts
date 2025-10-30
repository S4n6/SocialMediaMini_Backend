import { Injectable, Inject } from '@nestjs/common';
import {
  SendTextMessageUseCase,
  SendMediaMessageUseCase,
  EditMessageUseCase,
  DeleteMessageUseCase,
  AddReactionUseCase,
  GetConversationMessagesUseCase,
  MarkAsReadUseCase,
} from './index';
import { MessageType } from '../../domain/enums';

/**
 * Aggregated Message Use Cases Service
 * This provides a unified interface for all message-related operations
 */
@Injectable()
export class MessageUseCases {
  constructor(
    private readonly sendTextMessageUseCase: SendTextMessageUseCase,
    private readonly sendMediaMessageUseCase: SendMediaMessageUseCase,
    private readonly editMessageUseCase: EditMessageUseCase,
    private readonly deleteMessageUseCase: DeleteMessageUseCase,
    private readonly addReactionUseCase: AddReactionUseCase,
    private readonly getConversationMessagesUseCase: GetConversationMessagesUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
  ) {}

  async sendTextMessage(command: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<string> {
    const result = await this.sendTextMessageUseCase.execute(command);
    return result.messageId;
  }

  async sendMediaMessage(command: {
    conversationId: string;
    senderId: string;
    type: string;
    attachmentUrl: string;
    content?: string;
  }): Promise<string> {
    const result = await this.sendMediaMessageUseCase.execute({
      ...command,
      type: command.type as MessageType,
    });
    return result.messageId;
  }

  async editMessage(command: {
    messageId: string;
    userId: string;
    newContent: string;
  }): Promise<void> {
    await this.editMessageUseCase.execute({
      messageId: command.messageId,
      newContent: command.newContent,
      editedBy: command.userId,
    });
  }

  async deleteMessage(command: {
    messageId: string;
    userId: string;
  }): Promise<void> {
    await this.deleteMessageUseCase.execute({
      messageId: command.messageId,
      deletedBy: command.userId,
    });
  }

  async addReaction(command: {
    messageId: string;
    userId: string;
    reaction: string;
  }): Promise<void> {
    await this.addReactionUseCase.execute({
      messageId: command.messageId,
      userId: command.userId,
      emoji: command.reaction,
    });
  }

  async getConversationMessages(query: {
    conversationId: string;
    userId: string;
    limit?: number;
    cursor?: string;
  }): Promise<{
    messages: any[];
    hasMore: boolean;
    nextCursor?: string;
  }> {
    return await this.getConversationMessagesUseCase.execute(query);
  }

  async markMessageAsRead(command: {
    messageId: string;
    userId: string;
  }): Promise<void> {
    await this.markAsReadUseCase.markMessageAsRead(command);
  }

  // Additional convenience methods
  async getUnreadMessageCount(
    conversationId: string,
    userId: string,
  ): Promise<number> {
    // This would need to be implemented as a separate use case
    // For now, return 0 as placeholder
    return 0;
  }
}
