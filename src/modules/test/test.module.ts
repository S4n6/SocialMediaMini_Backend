import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { RabbitMQService } from './rabbitmq.service';

@Module({
  controllers: [TestController],
  providers: [RabbitMQService],
})
export class TestModule {}
