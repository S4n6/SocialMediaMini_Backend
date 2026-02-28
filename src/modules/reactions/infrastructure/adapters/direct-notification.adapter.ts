import { Injectable, Logger } from '@nestjs/common';
import { INotificationService } from '../../application/ports/i-external-services';

@Injectable()
export class DirectNotificationAdapter implements INotificationService {
  private readonly logger = new Logger(DirectNotificationAdapter.name);

  async createReactionNotification(data: {
    reactorId: string;
    targetUserId: string;
    entityId: string;
    entityType: 'post' | 'comment';
    content: string;
  }): Promise<void> {
    try {
      // TODO: Replace with actual notification implementation
      // Options: DB insert, RabbitMQ message to Golang worker, Redis pub/sub
      this.logger.log('Reaction notification queued', {
        reactorId: data.reactorId,
        targetUserId: data.targetUserId,
        entityType: data.entityType,
        entityId: data.entityId,
      });
    } catch (error) {
      this.logger.error('Failed to create reaction notification', error);
      throw error;
    }
  }
}
