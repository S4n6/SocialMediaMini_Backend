import { Injectable } from '@nestjs/common';
import { Conversation } from '../../domain';

// This service would be responsible for enriching conversations with additional data
// from other modules (e.g., participant profiles, last message details, etc.)
@Injectable()
export class ConversationEnrichmentService {
  constructor() // Inject adapters to other modules when needed
  // @Inject(USER_SERVICE_ADAPTER) private readonly userService: IUserServiceAdapter,
  {}

  async enrichConversation(conversation: Conversation): Promise<any> {
    const enrichedConversation = conversation.toPrimitives();

    // TODO: Add participant profile information
    // const participantProfiles = await Promise.all(
    //   conversation.activeParticipants.map(participant =>
    //     this.userService.getUserProfile(participant.userId.value)
    //   )
    // );
    // enrichedConversation.participantProfiles = participantProfiles;

    // TODO: Add creator profile
    // const creatorProfile = await this.userService.getUserProfile(conversation.createdBy.value);
    // enrichedConversation.creatorProfile = creatorProfile;

    return enrichedConversation;
  }

  async enrichConversations(conversations: Conversation[]): Promise<any[]> {
    return Promise.all(
      conversations.map((conversation) =>
        this.enrichConversation(conversation),
      ),
    );
  }

  async getConversationSummary(conversation: Conversation): Promise<any> {
    const summary = {
      id: conversation.id.value,
      type: conversation.type,
      title: conversation.title?.value,
      participantCount: conversation.activeParticipants.length,
      isActive: conversation.isActive(),
      lastActivity: conversation.lastActivityAt,
      unreadCount: conversation.unreadCount,
    };

    return summary;
  }
}
