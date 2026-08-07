/**
 * Normalized result returned by every media provider after a successful upload.
 */
export interface UploadResult {
  /** Publicly accessible URL of the uploaded file */
  url: string;
  /**
   * Provider-specific resource identifier used for deletion and URL generation.
   * - Cloudinary: the `public_id` (e.g. `SocialMedia/posts/abc123`)
   * - S3: the object key  (e.g. `uploads/1234567890-photo.jpg`)
   */
  publicId: string;
  /** MIME resource type: `image`, `video`, or `raw` — alias of resourceType for compatibility */
  type: string;
  /** MIME resource type: `image`, `video`, or `raw` */
  resourceType: string;
}

/**
 * Provider-specific upload credentials returned to the client so it can
 * upload directly to the media provider (Cloudinary signed upload /
 * S3 presigned PUT).
 */
export interface UploadCredentials {
  provider: 'cloudinary' | 's3';

  // ── Cloudinary direct-upload fields ──────────────────────────────
  signature?: string;
  timestamp?: number;
  apiKey?: string;
  cloudName?: string;
  folder?: string;

  // ── S3 presigned-PUT fields ───────────────────────────────────────
  uploadUrl?: string;
  key?: string;
  /** Seconds until the presigned URL expires (S3 only) */
  expiresIn?: number;
}

/**
 * Unified media interface.  Any provider (Cloudinary, S3, GCS, …) must
 * implement this contract.  Consumers only depend on this interface, never
 * on a concrete provider class.
 */
export interface IMediaService {
  /**
   * Upload a single file to the provider.
   * @param file   Multer file from an Express request
   * @param folder Optional folder/prefix within the media bucket
   */
  uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult>;

  /**
   * Upload multiple files concurrently.
   * @param files  Array of Multer files
   * @param folder Optional folder/prefix
   */
  uploadMultipleFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadResult[]>;

  /**
   * Delete a single file by its provider-specific public ID / object key.
   */
  deleteFile(publicId: string): Promise<void>;

  /**
   * Delete multiple files by their provider-specific public IDs / object keys.
   */
  deleteMultipleFiles(publicIds: string[]): Promise<void>;

  /**
   * Return the credentials the client needs to upload directly to the
   * media provider without proxying through this server.
   *
   * - Cloudinary: returns a signed timestamp + API key so the browser can
   *   call the Cloudinary Upload API directly.
   * - S3: returns a presigned PUT URL the browser can call directly.
   */
  getUploadCredentials(params: {
    folder?: string;
  }): Promise<UploadCredentials>;
}
