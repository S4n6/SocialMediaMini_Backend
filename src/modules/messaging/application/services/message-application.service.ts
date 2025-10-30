import { Injectable } from '@nestjs/common';
import {
  SendTextMessageUseCase,
  SendMediaMessageUseCase,
  EditMessageUseCase,
  DeleteMessageUseCase,
  AddReactionUseCase,
  GetConversationMessagesUseCase,
  MarkAsReadUseCase,
} from '../use-cases';
import { MessageType } from '../../domain';

@Injectable()
export class MessageApplicationService {
  constructor(
    private readonly sendTextMessageUseCase: SendTextMessageUseCase,
    private readonly sendMediaMessageUseCase: SendMediaMessageUseCase,
    private readonly editMessageUseCase: EditMessageUseCase,
    private readonly deleteMessageUseCase: DeleteMessageUseCase,
    private readonly addReactionUseCase: AddReactionUseCase,
    private readonly getConversationMessagesUseCase: GetConversationMessagesUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
  ) {}

  async sendQuickTextMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<string> {
    const result = await this.sendTextMessageUseCase.execute({
      conversationId,
      senderId,
      content,
    });
    return result.messageId;
  }

  async sendImageMessage(
    conversationId: string,
    senderId: string,
    attachmentUrl: string,
    caption?: string,
  ): Promise<string> {
    const result = await this.sendMediaMessageUseCase.execute({
      conversationId,
      senderId,
      type: MessageType.IMAGE,
      attachmentUrl,
      content: caption,
    });
    return result.messageId;
  }

  async sendVideoMessage(
    conversationId: string,
    senderId: string,
    attachmentUrl: string,
    caption?: string,
  ): Promise<string> {
    const result = await this.sendMediaMessageUseCase.execute({
      conversationId,
      senderId,
      type: MessageType.VIDEO,
      attachmentUrl,
      content: caption,
    });
    return result.messageId;
  }

  async sendDocumentMessage(
    conversationId: string,
    senderId: string,
    attachmentUrl: string,
    fileName?: string,
  ): Promise<string> {
    const result = await this.sendMediaMessageUseCase.execute({
      conversationId,
      senderId,
      type: MessageType.DOCUMENT,
      attachmentUrl,
      content: fileName,
    });
    return result.messageId;
  }

  async editMessage(
    messageId: string,
    newContent: string,
    editedBy: string,
  ): Promise<void> {
    await this.editMessageUseCase.execute({
      messageId,
      newContent,
      editedBy,
    });
  }

  async deleteMessage(messageId: string, deletedBy: string): Promise<void> {
    await this.deleteMessageUseCase.execute({
      messageId,
      deletedBy,
    });
  }

  async addReaction(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<void> {
    await this.addReactionUseCase.execute({
      messageId,
      emoji,
      userId,
    });
  }

  async getMessages(
    conversationId: string,
    userId: string,
    limit?: number,
    cursor?: string,
  ) {
    return await this.getConversationMessagesUseCase.execute({
      conversationId,
      userId,
      limit,
      cursor,
    });
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await this.markAsReadUseCase.markMessageAsRead({
      messageId,
      userId,
    });
  }

  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.markAsReadUseCase.markConversationAsRead({
      conversationId,
      userId,
    });
  }
}
