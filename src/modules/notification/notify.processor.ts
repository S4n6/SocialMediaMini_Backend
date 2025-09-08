import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../database/prisma.service';
import Redis from 'ioredis';

@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private readonly redisClient = new Redis(
    process.env.REDIS_URL || 'redis://localhost:6379',
  );

  constructor(
    private readonly notificationService: NotificationService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `[Job ${job.id}] Started processing job with name: ${job.name}`,
    );

    try {
      const { reactorId, targetUserId, type, content, entityId, entityType } =
        job.data;

      // Tìm nạp thông tin cần thiết từ cơ sở dữ liệu để đảm bảo tính nhất quán
      const reactor = await this.prismaService.user.findUnique({
        where: { id: reactorId },
      });

      if (!reactor) {
        this.logger.warn(
          `[Job ${job.id}] Reactor with ID ${reactorId} not found. Skipping notification.`,
        );
        return; // Dừng lại nếu không tìm thấy người tạo reaction
      }

      // Xây dựng tiêu đề thông báo
      const title = `${reactor.fullName} reacted to your ${type}`;

      // Tạo thông báo trong database
      const notification = await this.notificationService.create({
        userId: targetUserId,
        type: 'reaction',
        title,
        content: '', // Để trống hoặc nạp nội dung sau
        entityId,
        entityType: type,
      });

      // Publish sự kiện qua Redis
      this.redisClient.publish(
        'notifications',
        JSON.stringify({ targetUserId, notification }),
      );

      this.logger.log(
        `[Job ${job.id}] Notification published for user ${targetUserId}`,
      );
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed with error: ${error.message}`,
        error.stack,
      );
      // Ném lỗi để BullMQ có thể thử lại job nếu cần
      throw error;
    }
  }
}
