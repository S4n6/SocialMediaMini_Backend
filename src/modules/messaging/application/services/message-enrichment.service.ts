import { Injectable } from '@nestjs/common';
import { Conversation, Message } from '../../domain';

// This service would be responsible for enriching messages with additional data
// from other modules (e.g., user profiles, media metadata, etc.)
@Injectable()
export class MessageEnrichmentService {
  constructor() // Inject adapters to other modules when needed
  // @Inject(USER_SERVICE_ADAPTER) private readonly userService: IUserServiceAdapter,
  // @Inject(MEDIA_SERVICE_ADAPTER) private readonly mediaService: IMediaServiceAdapter,
  {}

  async enrichMessage(message: Message): Promise<any> {
    const enrichedMessage = message.toPrimitives();

    // TODO: Add user profile information
    // if (message.senderId) {
    //   const userProfile = await this.userService.getUserProfile(message.senderId.value);
    //   enrichedMessage.sender = userProfile;
    // }

    // TODO: Add media metadata for attachments
    // if (message.hasAttachment) {
    //   const mediaMetadata = await this.mediaService.getMediaMetadata(message.attachmentUrl);
    //   enrichedMessage.attachmentMetadata = mediaMetadata;
    // }

    return enrichedMessage;
  }

  async enrichMessages(messages: Message[]): Promise<any[]> {
    return Promise.all(messages.map((message) => this.enrichMessage(message)));
  }
}
