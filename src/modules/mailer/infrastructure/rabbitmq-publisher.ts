import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, type ChannelModel, type Channel } from 'amqplib';
import { IMessagePublisher } from '../ports/i-message-publisher.port';

/**
 * RabbitMQ Publisher – infrastructure adapter implementing IMessagePublisher.
 *
 * Uses the promises API of amqplib for clean async/await usage.
 * Manages its own connection lifecycle (connect on init, close on destroy).
 */
@Injectable()
export class RabbitMQPublisher
  implements IMessagePublisher, OnModuleInit, OnModuleDestroy
{
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private readonly logger = new Logger(RabbitMQPublisher.name);

  private readonly url: string;
  private readonly queueName: string;

  constructor(private readonly configService: ConfigService) {
    this.url =
      this.configService.get<string>('RABBITMQ_URL') ||
      'amqp://guest:guest@localhost:5672/';
    this.queueName =
      this.configService.get<string>('RABBITMQ_QUEUE') || 'worker_tasks';
  }

  // ── Lifecycle hooks ─────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  // ── IMessagePublisher ───────────────────────────────────────

  async connect(): Promise<void> {
    try {
      this.connection = await connect(this.url);
      this.channel = await this.connection.createChannel();

      // Declare a durable queue (idempotent — safe to call every time)
      await this.channel.assertQueue(this.queueName, { durable: true });

      this.logger.log(
        `Connected to RabbitMQ — queue "${this.queueName}" ready`,
      );
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.channel = null;
      this.connection = null;
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }

  async publish(message: unknown): Promise<boolean> {
    if (!this.channel) {
      throw new Error(
        'RabbitMQ channel not initialised — call connect() first',
      );
    }

    const buffer = Buffer.from(JSON.stringify(message));

    const sent = this.channel.sendToQueue(this.queueName, buffer, {
      persistent: true, // survive broker restarts
    });

    if (sent) {
      this.logger.debug(`Message published to queue "${this.queueName}"`);
    }

    return sent;
  }
}
