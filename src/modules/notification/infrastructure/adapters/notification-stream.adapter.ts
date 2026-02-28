import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  INotificationStream,
  NotificationSseEvent,
} from '../../application/ports/i-notification-stream.port';

/**
 * Per-user entry in the stream map.
 *
 * `refCount` tracks how many SSE connections (browser tabs) are consuming
 * this subject.  When it drops to 0 the subject is completed and removed
 * from the map, preventing memory leaks.
 */
interface StreamEntry {
  subject: Subject<NotificationSseEvent>;
  refCount: number;
}

/**
 * RxJS Subject–backed implementation of `INotificationStream`.
 *
 * Design decisions:
 *
 * 1. **One Subject per user** — multiple tabs share the same Subject.
 *    Each call to `subscribe()` increments `refCount`; unsubscribe
 *    (Observable teardown / client disconnect) decrements it.
 *
 * 2. **Automatic cleanup** — when the last tab disconnects (`refCount → 0`)
 *    the Subject is completed and the entry is deleted from the Map.
 *
 * 3. **push() is fire-and-forget** — if the user has no active connections
 *    the call is a no-op (the notification is already persisted in DB).
 *
 * 4. **OnModuleDestroy** — completes every Subject on graceful shutdown.
 */
@Injectable()
export class NotificationStreamAdapter
  implements INotificationStream, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationStreamAdapter.name);
  private readonly streams = new Map<string, StreamEntry>();

  // ── INotificationStream ─────────────────────────────────

  subscribe(userId: string): Observable<NotificationSseEvent> {
    let entry = this.streams.get(userId);

    if (!entry) {
      entry = { subject: new Subject<NotificationSseEvent>(), refCount: 0 };
      this.streams.set(userId, entry);
      this.logger.debug(`Created SSE stream for user ${userId}`);
    }

    entry.refCount++;
    this.logger.debug(
      `User ${userId} connected (refCount=${entry.refCount})`,
    );

    // Capture `entry` in closure — it remains stable for this userId
    const captured = entry;

    return captured.subject.asObservable().pipe(
      finalize(() => {
        captured.refCount--;
        this.logger.debug(
          `User ${userId} disconnected (refCount=${captured.refCount})`,
        );

        if (captured.refCount <= 0) {
          captured.subject.complete();
          this.streams.delete(userId);
          this.logger.debug(`Stream for user ${userId} cleaned up`);
        }
      }),
    );
  }

  push(userId: string, event: NotificationSseEvent): void {
    const entry = this.streams.get(userId);
    if (!entry) return; // user offline — already persisted in DB

    entry.subject.next(event);
  }

  getActiveUserCount(): number {
    return this.streams.size;
  }

  getTotalConnectionCount(): number {
    let total = 0;
    for (const entry of this.streams.values()) {
      total += entry.refCount;
    }
    return total;
  }

  // ── Lifecycle ───────────────────────────────────────────

  onModuleDestroy(): void {
    for (const [userId, entry] of this.streams) {
      entry.subject.complete();
      this.logger.debug(`Completed stream for user ${userId} on shutdown`);
    }
    this.streams.clear();
  }
}
