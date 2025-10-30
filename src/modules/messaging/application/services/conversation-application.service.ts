import { Injectable } from '@nestjs/common';
import {
  CreatePrivateConversationUseCase,
  CreateGroupConversationUseCase,
  GetUserConversationsUseCase,
  ManageParticipantsUseCase,
} from '../use-cases';

@Injectable()
export class ConversationApplicationService {
  constructor(
    private readonly createPrivateConversationUseCase: CreatePrivateConversationUseCase,
    private readonly createGroupConversationUseCase: CreateGroupConversationUseCase,
    private readonly getUserConversationsUseCase: GetUserConversationsUseCase,
    private readonly manageParticipantsUseCase: ManageParticipantsUseCase,
  ) {}

  async startPrivateChat(userId1: string, userId2: string): Promise<string> {
    const result = await this.createPrivateConversationUseCase.execute({
      participantIds: [userId1, userId2],
      createdBy: userId1,
    });
    return result.conversationId;
  }

  async createGroupChat(
    title: string,
    creatorId: string,
    memberIds: string[],
    description?: string,
    avatarUrl?: string,
  ): Promise<string> {
    // Add creator to members if not already included
    const allParticipants = memberIds.includes(creatorId)
      ? memberIds
      : [creatorId, ...memberIds];

    const result = await this.createGroupConversationUseCase.execute({
      title,
      participantIds: allParticipants,
      createdBy: creatorId,
      description,
      avatarUrl,
    });
    return result.conversationId;
  }

  async getUserConversations(userId: string, limit?: number, offset?: number) {
    return await this.getUserConversationsUseCase.execute({
      userId,
      limit,
      offset,
    });
  }

  async addMemberToGroup(
    conversationId: string,
    userId: string,
    addedBy: string,
  ): Promise<void> {
    await this.manageParticipantsUseCase.addParticipant({
      conversationId,
      userId,
      addedBy,
    });
  }

  async removeMemberFromGroup(
    conversationId: string,
    userId: string,
    removedBy: string,
  ): Promise<void> {
    await this.manageParticipantsUseCase.removeParticipant({
      conversationId,
      userId,
      removedBy,
    });
  }

  async leaveConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    await this.manageParticipantsUseCase.removeParticipant({
      conversationId,
      userId,
      removedBy: userId, // User removes themselves
    });
  }
}
