/**
 * NotificationPayload — Discriminated-union value object.
 *
 * Every notification carries a typed `metadata` bag whose shape depends on
 * the `kind` discriminant.  This stays in the domain layer because it is
 * pure TypeScript with zero framework imports.
 *
 * Consumers pattern-match on `kind` to extract the right fields:
 *
 * ```ts
 * switch (payload.kind) {
 *   case 'social':       payload.actorId;  break;
 *   case 'media_result': payload.mediaId;  break;
 *   case 'system':       payload.actionUrl; break;
 * }
 * ```
 */

// ────────────────────────────────────────────────────────────
// Variant interfaces
// ────────────────────────────────────────────────────────────

/** Likes, comments, follows, mentions — any user-to-user interaction */
export interface SocialPayload {
  readonly kind: 'social';
  readonly actorId: string;
  readonly actorName: string;
  readonly actorAvatar?: string;
  readonly targetId?: string;
  readonly targetName?: string;
}

/** Media upload / processing result coming back from the worker */
export interface MediaResultPayload {
  readonly kind: 'media_result';
  readonly mediaId: string;
  readonly status: 'success' | 'failed';
  readonly url?: string;
  readonly thumbnailUrl?: string;
  readonly error?: string;
}

/** System-wide announcements, maintenance, moderation decisions */
export interface SystemPayload {
  readonly kind: 'system';
  readonly message: string;
  readonly actionUrl?: string;
  readonly severity?: 'info' | 'warning' | 'critical';
}

/** Chat / direct-message preview */
export interface MessagePayload {
  readonly kind: 'message';
  readonly conversationId: string;
  readonly senderId: string;
  readonly senderName: string;
  readonly preview: string;
}

// ────────────────────────────────────────────────────────────
// Union type
// ────────────────────────────────────────────────────────────

export type NotificationPayload =
  | SocialPayload
  | MediaResultPayload
  | SystemPayload
  | MessagePayload;
