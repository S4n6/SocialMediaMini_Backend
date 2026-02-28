import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../notification.constants';
import { INotificationRepository } from '../../domain/repositories/i-notification.repository';
import { UnreadCountResponseDto } from '../dto/notification.dto';

@Injectable()
export class GetUnreadCountUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly repo: INotificationRepository,
  ) {}

  async execute(userId: string): Promise<UnreadCountResponseDto> {
    const count = await this.repo.countUnread(userId);
    return { count };
  }
}
