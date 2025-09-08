import { Queue } from 'bullmq';

export const mailQueue = new Queue('send-mail-queue', {
  connection: {
    url: process.env.REDIS_URL_WORKER || 'redis://127.0.0.1:6379',
  },
});
