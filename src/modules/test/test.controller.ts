import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Controller('test')
export class TestController {
  constructor(private readonly rabbitmqService: RabbitMQService) {}

  @Get()
  getTest() {
    return {
      status: 'OK',
      message: 'Test endpoint is working',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'OK',
      health: 'Service is healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ping')
  getPing() {
    return {
      status: 'OK',
      message: 'pong',
    };
  }
}
