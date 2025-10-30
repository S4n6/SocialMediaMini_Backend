import { Injectable } from '@nestjs/common';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { UserId } from '../value-objects';
import { ConversationType, MessageType } from '../enums';

@Injectable()
export class MessagingValidationService {
  public validateConversationAccess(
    conversation: Conversation,
    userId: UserId,
    operation: 'read' | 'write' | 'admin',
  ): void {
    if (!conversation.isParticipant(userId)) {
      throw new Error('User does not have access to this conversation');
    }

    if (operation === 'admin') {
      const participant = conversation.getParticipant(userId);
      if (!participant || participant.role !== 'admin') {
        throw new Error('User does not have admin privileges');
      }
    }
  }

  public validateMessageOperation(
    message: Message,
    userId: UserId,
    operation: 'edit' | 'delete' | 'react',
  ): void {
    switch (operation) {
      case 'edit':
      case 'delete':
        if (!message.senderId?.equals(userId)) {
          throw new Error('Only message sender can perform this operation');
        }
        if (message.type === MessageType.SYSTEM) {
          throw new Error('Cannot modify system messages');
        }
        break;
      case 'react':
        // Anyone in the conversation can react
        break;
      default:
        throw new Error('Unknown operation');
    }
  }

  public validateMessageContent(content: string, type: MessageType): void {
    if (
      type === MessageType.TEXT &&
      (!content || content.trim().length === 0)
    ) {
      throw new Error('Text message content cannot be empty');
    }

    if (content && content.length > 10000) {
      throw new Error('Message content cannot exceed 10000 characters');
    }
  }

  public validateConversationParticipants(
    participants: UserId[],
    type: ConversationType,
  ): void {
    if (type === ConversationType.PRIVATE && participants.length !== 2) {
      throw new Error('Private conversation must have exactly 2 participants');
    }

    if (type === ConversationType.GROUP && participants.length < 2) {
      throw new Error('Group conversation must have at least 2 participants');
    }

    if (participants.length > 100) {
      throw new Error('Conversation cannot have more than 100 participants');
    }

    // Check for duplicate participants
    const uniqueParticipants = new Set(participants.map((p) => p.value));
    if (uniqueParticipants.size !== participants.length) {
      throw new Error('Duplicate participants are not allowed');
    }
  }
}
