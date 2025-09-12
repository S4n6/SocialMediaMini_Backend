import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { JwtModule } from '@nestjs/jwt';
import { JWT } from '../../config/jwt.config';
import { BullModule } from '@nestjs/bullmq';
import { NotificationGateway } from './notification.gateway';
import { QUEUE } from '../../config/queue.config';
import { REDIS } from '../../config/redis.config';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationProcessor } from './notify.processor';

@Module({
  imports: [
    JwtModule.register({
      secret: JWT.SECRET,
    }),
    BullModule.forRoot({
      connection: {
        url: REDIS.URL_WORKER,
      },
    }),
    BullModule.registerQueue({ name: QUEUE.NOTIFICATION }),
    PrismaModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
