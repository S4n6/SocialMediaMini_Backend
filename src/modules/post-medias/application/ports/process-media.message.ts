import { PostMediaType } from '../../domain/post-media.entity';

/**
 * Payload for the `process_media` task sent to the Go worker.
 *
 * Field names use snake_case to match the Go struct JSON tags
 * in `internal/tasks/media/types.go`.
 */
export interface ProcessMediaPayload {
  media_id: string;
  post_id: string;
  s3_key: string;
  media_type: PostMediaType; // "image" | "video"
  user_id: string;
}

/**
 * Full RabbitMQ message envelope for media processing.
 *
 * Follows the same `{ type, payload }` envelope format as
 * the `send_email` task.
 */
export interface ProcessMediaMessage {
  type: 'process_media';
  payload: ProcessMediaPayload;
}
