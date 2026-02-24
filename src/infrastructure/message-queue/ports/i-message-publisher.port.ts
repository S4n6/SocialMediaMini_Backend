/**
 * Message Publisher Port
 *
 * Application-layer contract for publishing messages to an external
 * message broker (RabbitMQ, Kafka, SQS, etc.).
 * Infrastructure adapters implement this interface.
 *
 * Shared across all modules that need to publish to the worker queue.
 */
export interface IMessagePublisher {
  /**
   * Publish a message to the configured queue / topic.
   * @param message - Serialisable object matching the worker's envelope format.
   * @returns true when the broker accepted the message.
   */
  publish(message: unknown): Promise<boolean>;

  /**
   * Establish the connection to the broker.
   * Called during module initialisation.
   */
  connect(): Promise<void>;

  /**
   * Gracefully close the connection.
   * Called during module teardown.
   */
  disconnect(): Promise<void>;
}
