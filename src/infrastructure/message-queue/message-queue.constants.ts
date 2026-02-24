/**
 * Shared Messaging – Dependency Injection Tokens & Task Type Constants
 *
 * Task type constants MUST be kept in sync with the Go worker's
 * dispatcher registrations in `cmd/worker/main.go`.
 */

// ── DI Tokens ───────────────────────────────────────────────
export const MESSAGE_PUBLISHER_TOKEN = 'MESSAGE_PUBLISHER';

// ── Task Types (must match Go worker handler Type() values) ─
export const TASK_TYPE_SEND_EMAIL = 'send_email';
export const TASK_TYPE_PROCESS_MEDIA = 'process_media';
