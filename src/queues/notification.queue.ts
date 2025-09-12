import { Queue } from 'bullmq';
import { REDIS } from 'src/config/redis.config';

export const notificationQueue = new Queue('notification-queue', {
  connection: {
    url: REDIS.URL_WORKER,
  },
});
