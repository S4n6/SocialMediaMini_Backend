import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IMessageRepository,
  IConversationRepository,
  MessageDomainService,
  MessagingValidationService,
  MessageId,
  UserId,
} from '../../domain';

export interface EditMessageCommand {
  messageId: string;
  newContent: string;
  editedBy: string;
}

@Injectable()
export class EditMessageUseCase {
  constructor(
    @Inject(MESSAGING_TOKENS.MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    @Inject(MESSAGING_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: IConversationRepository,
    @Inject(MESSAGING_TOKENS.MESSAGE_DOMAIN_SERVICE)
    private readonly messageDomainService: MessageDomainService,
    @Inject(MESSAGING_TOKENS.MESSAGING_VALIDATION_SERVICE)
    private readonly validationService: MessagingValidationService,
  ) {}

  async execute(command: EditMessageCommand): Promise<void> {
    const messageId = MessageId.fromString(command.messageId);
    const editedBy = UserId.fromString(command.editedBy);

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    this.validationService.validateMessageOperation(message, editedBy, 'edit');
    this.validationService.validateMessageContent(
      command.newContent,
      message.type,
    );

    if (!message.isEditableWithinTimeLimit(24)) {
      throw new Error(
        'Message can no longer be edited (24-hour limit exceeded)',
      );
    }

    const editedMessage = this.messageDomainService.editMessage(
      message,
      command.newContent,
      new Date(),
    );

    await this.messageRepository.update(editedMessage);
  }
}
