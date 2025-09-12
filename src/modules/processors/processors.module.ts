// src/workers/processor.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationProcessor } from '../notification/notify.processor';
import { NotificationService } from '../notification/notification.service';
import { JwtModule } from '@nestjs/jwt';
import { JWT } from '../../config/jwt.config';
import { REDIS } from '../../config/redis.config';
import { QUEUE } from '../../config/queue.config';

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
  providers: [NotificationProcessor, NotificationService],
})
export class ProcessorModule {}
