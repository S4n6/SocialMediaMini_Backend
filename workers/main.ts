// file src/workers/notify.worker.ts
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ProcessorModule } from '../src/modules/processors/processors.module';

async function bootstrap() {
  const logger = new Logger('Worker');
  const app = await NestFactory.createApplicationContext(ProcessorModule);
  await app.init();
  logger.log('Worker process has started.');
}
bootstrap();
