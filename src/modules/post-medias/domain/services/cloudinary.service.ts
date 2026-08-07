import {
  IMediaService,
  UploadResult,
  UploadCredentials,
} from '../../../media/media.interface';

/**
 * Re-export UploadedFile shape so existing use-cases don't need to change
 * their import path.  Backed by the unified UploadResult type.
 */
export type { UploadResult, UploadCredentials };
export type UploadedFile = UploadResult;

/**
 * Domain-layer alias for the media port.
 *
 * Use cases depend on this interface (via the CLOUDINARY_SERVICE token, which
 * is aliased to MEDIA_SERVICE) rather than on any concrete provider class.
 * This keeps the domain layer free of infrastructure concerns.
 */
export type MediaService = IMediaService;

// Keep the old name as an alias so the rename is backward-compatible
// with any remaining references during migration.
export type CloudinaryService = IMediaService;
export type { IMediaService };
