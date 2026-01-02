import { Injectable, Inject } from '@nestjs/common';
import { MESSAGING_TOKENS } from '../../constants';
import {
  IMessageRepository,
  MessagingValidationService,
  MessageId,
  UserId,
} from '../../domain';

export interface DeleteMessageCommand {
  messageId: string;
  deletedBy: string;
}

@Injectable()
export class DeleteMessageUseCase {
  constructor(
    @Inject(MESSAGING_TOKENS.MESSAGE_REPOSITORY)
    private readonly messageRepository: IMessageRepository,
    @Inject(MESSAGING_TOKENS.MESSAGING_VALIDATION_SERVICE)
    private readonly validationService: MessagingValidationService,
  ) {}

  async execute(command: DeleteMessageCommand): Promise<void> {
    const messageId = MessageId.fromString(command.messageId);
    const deletedBy = UserId.fromString(command.deletedBy);

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    this.validationService.validateMessageOperation(
      message,
      deletedBy,
      'delete',
    );

    await this.messageRepository.delete(messageId);
  }
}
