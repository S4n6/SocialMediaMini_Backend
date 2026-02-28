import { Observable } from 'rxjs';

/**
 * Application port for the real-time notification stream (SSE).
 *
 * The application layer owns this contract; infrastructure provides the
 * RxJS-Subject-based implementation with per-user reference counting.
 */
export interface INotificationStream {
  /**
   * Open (or reuse) the observable for a given user.
   * Each call increments a reference counter so multiple browser tabs
   * share the same underlying Subject.
   *
   * The returned Observable automatically decrements the counter on
   * unsubscribe and cleans up the Subject when refCount reaches 0.
   */
  subscribe(userId: string): Observable<NotificationSseEvent>;

  /**
   * Push a notification into the user's active stream.
   * No-op if the user has no active SSE connections.
   */
  push(userId: string, event: NotificationSseEvent): void;

  /** Number of users with at least one active SSE connection */
  getActiveUserCount(): number;

  /** Total number of SSE connections (across all users) */
  getTotalConnectionCount(): number;
}

/**
 * Wire format of a single SSE event.
 *
 * `id`    — Used by the browser as `Last-Event-ID` on reconnect.
 * `type`  — Maps to `EventSource.addEventListener(type, …)` on the client.
 * `data`  — JSON-serialisable payload.
 */
export interface NotificationSseEvent {
  id: string;
  type: string;
  data: Record<string, any>;
}
