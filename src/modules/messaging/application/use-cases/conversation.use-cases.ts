import { Injectable, Inject } from '@nestjs/common';
import {
  CONVERSATION_REPOSITORY,
  MESSAGE_REPOSITORY,
} from '../../infrastructure/messaging-infrastructure.module';
import {
  IConversationRepository,
  IMessageRepository,
} from '../../domain/repositories';
import {
  Conversation,
  ConversationDomainService,
  MessagingValidationService,
  ConversationId,
  UserId,
  ConversationTitle,
} from '../../domain';
import { ConversationType } from '../../domain/enums';

export interface CreatePrivateConversationCommand {
  participantIds: [string, string];
  createdBy: string;
}

export interface CreateGroupConversationCommand {
  title: string;
  participantIds: string[];
  createdBy: string;
}

export interface AddParticipantCommand {
  conversationId: string;
  userId: string;
  addedBy: string;
}

export interface RemoveParticipantCommand {
  conversationId: string;
  userId: string;
  removedBy: string;
}

export interface UpdateConversationTitleCommand {
  conversationId: string;
  title: string;
  updatedBy: string;
}

export interface GetUserConversationsQuery {
  userId: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ConversationUseCases {
  constructor(
    @Inject(CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    private readonly conversationDomainService: ConversationDomainService,
    private readonly validationService: MessagingValidationService,
  ) {}

  async createPrivateConversation(
    command: CreatePrivateConversationCommand,
  ): Promise<string> {
    const participantIds = command.participantIds.map((id) =>
      UserId.fromString(id),
    ) as [UserId, UserId];
    const createdBy = UserId.fromString(command.createdBy);

    // Check if private conversation already exists between these users
    const existingConversations =
      await this.conversationRepository.findByParticipants(participantIds);
    const existingPrivateConversation = existingConversations.find(
      (conv) => conv.type === ConversationType.PRIVATE,
    );

    if (existingPrivateConversation) {
      return existingPrivateConversation.id.value;
    }

    const conversation =
      this.conversationDomainService.createPrivateConversation(
        participantIds,
        createdBy,
      );

    await this.conversationRepository.save(conversation);
    return conversation.id.value;
  }

  async createGroupConversation(
    command: CreateGroupConversationCommand,
  ): Promise<string> {
    const participantIds = command.participantIds.map((id) =>
      UserId.fromString(id),
    );
    const createdBy = UserId.fromString(command.createdBy);

    this.validationService.validateConversationParticipants(
      participantIds,
      ConversationType.GROUP,
    );

    const conversation = this.conversationDomainService.createGroupConversation(
      command.title,
      participantIds,
      createdBy,
    );

    await this.conversationRepository.save(conversation);
    return conversation.id.value;
  }

  async addParticipant(command: AddParticipantCommand): Promise<void> {
    const conversationId = ConversationId.fromString(command.conversationId);
    const userId = UserId.fromString(command.userId);
    const addedBy = UserId.fromString(command.addedBy);

    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.validationService.validateConversationAccess(
      conversation,
      addedBy,
      'admin',
    );

    const updatedConversation = this.conversationDomainService.addParticipant(
      conversation,
      userId,
      addedBy,
    );

    await this.conversationRepository.update(updatedConversation);
  }

  async removeParticipant(command: RemoveParticipantCommand): Promise<void> {
    const conversationId = ConversationId.fromString(command.conversationId);
    const userId = UserId.fromString(command.userId);
    const removedBy = UserId.fromString(command.removedBy);

    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Allow self-removal or admin removal
    if (!removedBy.equals(userId)) {
      this.validationService.validateConversationAccess(
        conversation,
        removedBy,
        'admin',
      );
    }

    const updatedConversation =
      this.conversationDomainService.removeParticipant(
        conversation,
        userId,
        removedBy,
      );

    await this.conversationRepository.update(updatedConversation);
  }

  async updateConversationTitle(
    command: UpdateConversationTitleCommand,
  ): Promise<void> {
    const conversationId = ConversationId.fromString(command.conversationId);
    const updatedBy = UserId.fromString(command.updatedBy);
    const title = ConversationTitle.create(command.title);

    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.validationService.validateConversationAccess(
      conversation,
      updatedBy,
      'write',
    );

    const updatedConversation = conversation.updateTitle(title);
    await this.conversationRepository.update(updatedConversation);
  }

  async getUserConversations(
    query: GetUserConversationsQuery,
  ): Promise<Conversation[]> {
    const userId = UserId.fromString(query.userId);
    return await this.conversationRepository.findByParticipant(userId);
  }

  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<Conversation | null> {
    const convId = ConversationId.fromString(conversationId);
    const reqUserId = UserId.fromString(userId);

    const conversation = await this.conversationRepository.findById(convId);
    if (!conversation) {
      return null;
    }

    // Validate user has access to this conversation
    this.validationService.validateConversationAccess(
      conversation,
      reqUserId,
      'read',
    );

    return conversation;
  }

  async archiveConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const convId = ConversationId.fromString(conversationId);
    const reqUserId = UserId.fromString(userId);

    const conversation = await this.conversationRepository.findById(convId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.validationService.validateConversationAccess(
      conversation,
      reqUserId,
      'write',
    );

    const archivedConversation = conversation.archive();
    await this.conversationRepository.update(archivedConversation);
  }

  async unarchiveConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const convId = ConversationId.fromString(conversationId);
    const reqUserId = UserId.fromString(userId);

    const conversation = await this.conversationRepository.findById(convId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    this.validationService.validateConversationAccess(
      conversation,
      reqUserId,
      'write',
    );

    const unarchivedConversation = conversation.unarchive();
    await this.conversationRepository.update(unarchivedConversation);
  }
}
