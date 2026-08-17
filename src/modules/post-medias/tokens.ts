// Dependency injection tokens for Post Media module

export const POST_MEDIA_APPLICATION_SERVICE = Symbol(
  'POST_MEDIA_APPLICATION_SERVICE',
);
export const POST_MEDIA_REPOSITORY = Symbol('POST_MEDIA_REPOSITORY');
export const POST_SERVICE = Symbol('POST_SERVICE');

/**
 * Token for the active media provider (Cloudinary, S3, …).
 * The concrete implementation is wired by MediaModule via the
 * MEDIA_SERVICE token — see postMedias.module.ts.
 *
 * @deprecated import MEDIA_SERVICE from '../../media/media.tokens'
 * and inject the MediaModule directly instead of this alias.
 */
export const CLOUDINARY_SERVICE = Symbol('CLOUDINARY_SERVICE');

// Re-export the canonical token so new code can import from one place
export { MEDIA_SERVICE } from '../media/media.tokens';
