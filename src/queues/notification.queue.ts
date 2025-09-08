import { Queue } from 'bullmq';
import { REDIS } from 'src/constants/redis.constant';

export const notificationQueue = new Queue('notification-queue', {
  connection: {
    url: REDIS.URL_WORKER,
  },
});
