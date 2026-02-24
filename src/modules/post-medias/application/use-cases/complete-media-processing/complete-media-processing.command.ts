/**
 * Command object for the CompleteMediaProcessing use case.
 *
 * Populated from the MediaProcessingCallbackDto in the controller layer.
 */
export interface CompleteMediaProcessingCommand {
  /** PostMedia entity ID */
  mediaId: string;

  /** Post that owns this media */
  postId: string;

  /** Whether processing succeeded or failed */
  status: 'success' | 'failed';

  /** CDN URL of the processed file (required when status = success) */
  processedUrl?: string;

  /** CDN URL of the thumbnail (optional) */
  thumbnailUrl?: string;

  /** Error details (required when status = failed) */
  errorMessage?: string;
}
