import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MESSAGING_EVENTS } from '../../constants';
import {
  MessageSentEvent,
  MessageDeliveredEvent,
  MessageReadEvent,
  MessageEditedEvent,
} from '../../domain/events';
import {
  ConversationCreatedEvent,
  ConversationUpdatedEvent,
} from '../../domain/events';
import { MessagingWebSocketService } from '../services/messaging-websocket.service';

/**
 * Messaging Event Subscriber
 *
 * Listens for domain events emitted by use cases (via @nestjs/event-emitter)
 * and pushes real-time updates to connected WebSocket clients.
 *
 * This is the proper event-driven pattern for side effects:
 * - Use case emits domain event after successful persistence
 * - This subscriber catches the event and broadcasts to relevant rooms
 * - Zero coupling between the use case and WebSocket infrastructure
 *
 * When to add a new handler:
 * - Whenever a use case starts emitting a new domain event that clients need
 */
@Injectable()
export class MessagingEventSubscriber {
  private readonly logger = new Logger(MessagingEventSubscriber.name);

  constructor(private readonly wsService: MessagingWebSocketService) {}

  @OnEvent(MESSAGING_EVENTS.MESSAGE_SENT)
  async handleMessageSent(event: MessageSentEvent): Promise<void> {
    try {
      const data = event.data;
      await this.wsService.broadcastNewMessage(data.conversationId.value, {
        messageId: data.messageId.value,
        conversationId: data.conversationId.value,
        senderId: data.senderId.value,
        content: data.content.value,
        type: data.type,
        sentAt: data.sentAt.toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to handle MessageSent event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(MESSAGING_EVENTS.MESSAGE_DELIVERED)
  async handleMessageDelivered(event: MessageDeliveredEvent): Promise<void> {
    try {
      const data = event.data;
      await this.wsService.broadcastMessageDelivered(
        data.conversationId.value,
        data.messageId.value,
        data.senderId.value,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle MessageDelivered event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(MESSAGING_EVENTS.MESSAGE_READ)
  async handleMessageRead(event: MessageReadEvent): Promise<void> {
    try {
      const data = event.data;
      await this.wsService.broadcastReadReceipt(
        data.conversationId.value,
        data.readBy.value,
        data.messageId.value,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle MessageRead event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(MESSAGING_EVENTS.MESSAGE_EDITED)
  async handleMessageEdited(event: MessageEditedEvent): Promise<void> {
    try {
      const data = event.data;
      await this.wsService.broadcastConversationUpdate(
        data.conversationId.value,
        {
          action: 'message_edited',
          messageId: data.messageId.value,
          editedBy: data.editedBy.value,
          newContent: data.newContent.value,
          editedAt: data.editedAt.toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle MessageEdited event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(MESSAGING_EVENTS.CONVERSATION_CREATED)
  async handleConversationCreated(
    event: ConversationCreatedEvent,
  ): Promise<void> {
    try {
      const data = event.data;

      // Notify each participant about the new conversation
      const notifications = data.participants.map((participantId) =>
        this.wsService.notifyNewConversation(participantId.value, {
          conversationId: data.conversationId.value,
          type: data.type,
          createdBy: data.createdBy.value,
          title: data.title?.value,
          createdAt: data.createdAt.toISOString(),
        }),
      );

      await Promise.all(notifications);
    } catch (error) {
      this.logger.error(
        `Failed to handle ConversationCreated event: ${error.message}`,
        error.stack,
      );
    }
  }

  @OnEvent(MESSAGING_EVENTS.CONVERSATION_UPDATED)
  async handleConversationUpdated(
    event: ConversationUpdatedEvent,
  ): Promise<void> {
    try {
      const data = event.data;
      await this.wsService.broadcastConversationUpdate(
        data.conversationId.value,
        {
          action: 'updated',
          updatedBy: data.updatedBy.value,
          changes: {
            title: data.changes.title?.value,
            description: data.changes.description,
            avatarUrl: data.changes.avatarUrl,
          },
          updatedAt: data.updatedAt.toISOString(),
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle ConversationUpdated event: ${error.message}`,
        error.stack,
      );
    }
  }
}
