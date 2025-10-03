import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Message, MessageType, MessageContent } from '../domain/message.entity';
import { MessageStatus } from '../domain/enums';
import { Conversation } from '../domain/conversation.entity';
import {
  MessageRepository,
  ConversationRepository,
} from './repositories.interface';
import {
  ConversationId,
  MessageId,
  UserId,
  ConversationParticipant,
} from '../domain/value-objects';
import { WebSocketGatewayService } from '../../../shared/websocket';
import { WebSocketEvent, WebSocketNamespace } from '../../../shared/websocket';

export interface SendMessageRequest {
  conversationId: string;
  senderId: string;
  content: MessageContent;
  type: MessageType;
}

export interface GetMessagesRequest {
  conversationId: string;
  userId: string;
  limit?: number;
  offset?: number;
}

export interface MarkMessagesAsReadRequest {
  conversationId: string;
  userId: string;
  messageIds?: string[]; // If not provided, mark all unread messages as read
}

@Injectable()
export class MessageUseCases {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly webSocketGateway: WebSocketGatewayService,
  ) {}

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    // Verify user is participant in conversation
    const conversation = await this.conversationRepository.findById(
      request.conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.isParticipant(UserId.fromString(request.senderId))) {
      throw new ForbiddenException(
        'User is not a participant in this conversation',
      );
    }

    // Create message
    const message = Message.create({
      id: MessageId.create(),
      conversationId: ConversationId.fromString(request.conversationId),
      senderId: UserId.fromString(request.senderId),
      content: request.content,
      type: request.type,
      status: MessageStatus.PENDING,
      sentAt: new Date(),
    });

    // Save message
    await this.messageRepository.create(message);

    // Emit real-time message to all participants
    await this.emitMessageToParticipants(
      message,
      this.extractParticipantIds(conversation.participants),
    );

    // Emit conversation updated event
    await this.emitConversationUpdate(
      request.conversationId,
      this.extractParticipantIds(conversation.participants),
    );

    return message;
  }

  async getMessages(request: GetMessagesRequest): Promise<Message[]> {
    // Verify user is participant in conversation
    const conversation = await this.conversationRepository.findById(
      request.conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.isParticipant(UserId.fromString(request.userId))) {
      throw new ForbiddenException(
        'User is not a participant in this conversation',
      );
    }

    return this.messageRepository.findByConversationId(
      request.conversationId,
      request.limit,
      request.offset,
    );
  }

  async getMessageById(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findById(messageId);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is participant in the conversation
    const conversation = await this.conversationRepository.findById(
      message.conversationId.value,
    );

    if (
      !conversation ||
      !conversation.isParticipant(UserId.fromString(userId))
    ) {
      throw new ForbiddenException(
        'User is not a participant in this conversation',
      );
    }

    return message;
  }

  async markMessagesAsRead(request: MarkMessagesAsReadRequest): Promise<void> {
    // Verify user is participant in conversation
    const conversation = await this.conversationRepository.findById(
      request.conversationId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.isParticipant(UserId.fromString(request.userId))) {
      throw new ForbiddenException(
        'User is not a participant in this conversation',
      );
    }

    let messageIds = request.messageIds;

    // If no specific messages provided, get all unread messages
    if (!messageIds || messageIds.length === 0) {
      const unreadMessages =
        await this.messageRepository.findUnreadByConversationId(
          request.conversationId,
          request.userId,
        );
      messageIds = unreadMessages.map((msg) => msg.id.value);
    }

    if (messageIds && messageIds.length > 0) {
      await this.messageRepository.markAsRead(messageIds, request.userId);

      // Emit read receipts to other participants
      await this.emitReadReceipts(
        messageIds,
        request.userId,
        this.extractParticipantIds(conversation.participants),
      );
    }
  }

  async markMessagesAsDelivered(messageIds: string[]): Promise<void> {
    if (messageIds.length > 0) {
      await this.messageRepository.markAsDelivered(messageIds);
    }
  }

  async editMessage(
    messageId: string,
    newContent: MessageContent,
    userId: string,
  ): Promise<Message> {
    const message = await this.getMessageById(messageId, userId);

    // Only sender can edit their message
    if (!message.senderId || message.senderId.value !== userId) {
      throw new ForbiddenException('Can only edit your own messages');
    }

    // Cannot edit deleted messages
    if (message.isDeleted()) {
      throw new Error('Cannot edit deleted messages');
    }

    message.editContent(newContent);
    await this.messageRepository.update(message);

    // Emit message updated event
    const conversation = await this.conversationRepository.findById(
      message.conversationId.value,
    );
    if (conversation) {
      await this.emitMessageUpdate(
        message,
        this.extractParticipantIds(conversation.participants),
      );
    }

    return message;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.getMessageById(messageId, userId);

    // Only sender can delete their message
    if (!message.senderId || message.senderId.value !== userId) {
      throw new ForbiddenException('Can only delete your own messages');
    }

    message.deleteMessage();
    await this.messageRepository.update(message);

    // Emit message deleted event
    const conversation = await this.conversationRepository.findById(
      message.conversationId.value,
    );
    if (conversation) {
      await this.emitMessageDelete(
        message,
        this.extractParticipantIds(conversation.participants),
      );
    }
  }

  async addReactionToMessage(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<void> {
    const message = await this.getMessageById(messageId, userId);

    message.addReaction(emoji, UserId.fromString(userId));
    await this.messageRepository.update(message);

    // Emit reaction added event
    const conversation = await this.conversationRepository.findById(
      message.conversationId.value,
    );
    if (conversation) {
      await this.emitReactionUpdate(
        message,
        this.extractParticipantIds(conversation.participants),
      );
    }
  }

  async removeReactionFromMessage(
    messageId: string,
    emoji: string,
    userId: string,
  ): Promise<void> {
    const message = await this.getMessageById(messageId, userId);

    message.removeReaction(emoji, UserId.fromString(userId));
    await this.messageRepository.update(message);

    // Emit reaction removed event
    const conversation = await this.conversationRepository.findById(
      message.conversationId.value,
    );
    if (conversation) {
      await this.emitReactionUpdate(
        message,
        this.extractParticipantIds(conversation.participants),
      );
    }
  }

  async searchMessages(
    query: string,
    userId: string,
    limit?: number,
  ): Promise<Message[]> {
    return this.messageRepository.searchMessages(query, userId, limit);
  }

  async getUserUnreadMessages(userId: string): Promise<Message[]> {
    return this.messageRepository.findUnreadByUserId(userId);
  }

  // Real-time event emission methods
  private async emitMessageToParticipants(
    message: Message,
    participants: string[],
  ): Promise<void> {
    for (const participantId of participants) {
      if (participantId !== message.senderId?.value) {
        await this.webSocketGateway.emitToUser(
          participantId,
          WebSocketEvent.MESSAGE_RECEIVED,
          {
            message: this.serializeMessage(message),
            conversationId: message.conversationId.value,
          },
          WebSocketNamespace.MESSAGING,
        );
      }
    }

    // Emit to sender as well for confirmation
    if (message.senderId) {
      await this.webSocketGateway.emitToUser(
        message.senderId.value,
        WebSocketEvent.MESSAGE_SENT,
        {
          message: this.serializeMessage(message),
          conversationId: message.conversationId.value,
        },
        WebSocketNamespace.MESSAGING,
      );
    }
  }

  private async emitConversationUpdate(
    conversationId: string,
    participants: string[],
  ): Promise<void> {
    for (const participantId of participants) {
      await this.webSocketGateway.emitToUser(
        participantId,
        WebSocketEvent.CONVERSATION_UPDATED,
        { conversationId },
        WebSocketNamespace.MESSAGING,
      );
    }
  }

  private async emitMessageUpdate(
    message: Message,
    participants: string[],
  ): Promise<void> {
    for (const participantId of participants) {
      await this.webSocketGateway.emitToUser(
        participantId,
        WebSocketEvent.MESSAGE_RECEIVED, // Reuse for updates
        {
          message: this.serializeMessage(message),
          conversationId: message.conversationId.value,
          isUpdate: true,
        },
        WebSocketNamespace.MESSAGING,
      );
    }
  }

  private async emitMessageDelete(
    message: Message,
    participants: string[],
  ): Promise<void> {
    for (const participantId of participants) {
      await this.webSocketGateway.emitToUser(
        participantId,
        WebSocketEvent.MESSAGE_RECEIVED, // Reuse for deletions
        {
          message: this.serializeMessage(message),
          conversationId: message.conversationId.value,
          isDeleted: true,
        },
        WebSocketNamespace.MESSAGING,
      );
    }
  }

  private async emitReactionUpdate(
    message: Message,
    participants: string[],
  ): Promise<void> {
    for (const participantId of participants) {
      await this.webSocketGateway.emitToUser(
        participantId,
        WebSocketEvent.MESSAGE_RECEIVED, // Reuse for reactions
        {
          message: this.serializeMessage(message),
          conversationId: message.conversationId.value,
          isReactionUpdate: true,
        },
        WebSocketNamespace.MESSAGING,
      );
    }
  }

  private async emitReadReceipts(
    messageIds: string[],
    userId: string,
    participants: string[],
  ): Promise<void> {
    for (const participantId of participants) {
      if (participantId !== userId) {
        await this.webSocketGateway.emitToUser(
          participantId,
          WebSocketEvent.MESSAGE_READ,
          {
            messageIds,
            readByUserId: userId,
            readAt: new Date(),
          },
          WebSocketNamespace.MESSAGING,
        );
      }
    }
  }

  private extractParticipantIds(
    participants: ConversationParticipant[],
  ): string[] {
    return participants.map((participant) => participant.userId.value);
  }

  private serializeMessage(message: Message): any {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      deliveredAt: message.deliveredAt,
      readAt: message.readAt,
      metadata: message.metadata,
    };
  }
}
