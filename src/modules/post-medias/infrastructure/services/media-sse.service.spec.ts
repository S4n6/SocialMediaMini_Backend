import { firstValueFrom, take, toArray, Subject } from 'rxjs';
import {
  MediaSseService,
  MediaSseEventType,
  MediaSseEventPayload,
} from './media-sse.service';

describe('MediaSseService', () => {
  let service: MediaSseService;

  beforeEach(() => {
    service = new MediaSseService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should deliver event to the correct user stream', async () => {
    const stream$ = service.createStream('user-1');

    // Collect the first event
    const eventPromise = firstValueFrom(stream$.pipe(take(1)));

    const payload: MediaSseEventPayload = {
      type: MediaSseEventType.MEDIA_PROCESSED,
      mediaId: 'media-1',
      postId: 'post-1',
      processedUrl: 'https://cdn.example.com/img.jpg',
      thumbnailUrl: null,
      timestamp: new Date().toISOString(),
    };

    service.pushEvent('user-1', payload);

    const result = await eventPromise;

    expect(result.data).toEqual(payload);
    expect(result.type).toBe(MediaSseEventType.MEDIA_PROCESSED);
    expect(result.id).toContain('media-1');
  });

  it('should NOT deliver events to a different user', async () => {
    const events: any[] = [];
    const sub = service.createStream('user-A').subscribe((e) => events.push(e));

    service.pushEvent('user-B', {
      type: MediaSseEventType.MEDIA_PROCESSED,
      mediaId: 'media-x',
      postId: 'post-x',
      timestamp: new Date().toISOString(),
    });

    // Give the event loop a tick to process
    await new Promise((r) => setTimeout(r, 10));

    expect(events).toHaveLength(0);
    sub.unsubscribe();
  });

  it('should support multiple events to same user', async () => {
    const stream$ = service.createStream('user-2');
    const eventsPromise = firstValueFrom(stream$.pipe(take(2), toArray()));

    service.pushEvent('user-2', {
      type: MediaSseEventType.MEDIA_PROCESSED,
      mediaId: 'media-a',
      postId: 'post-1',
      processedUrl: 'https://cdn.example.com/a.jpg',
      timestamp: new Date().toISOString(),
    });

    service.pushEvent('user-2', {
      type: MediaSseEventType.MEDIA_FAILED,
      mediaId: 'media-b',
      postId: 'post-1',
      errorMessage: 'Oops',
      timestamp: new Date().toISOString(),
    });

    const results = await eventsPromise;
    expect(results).toHaveLength(2);
    expect(results[0].type).toBe(MediaSseEventType.MEDIA_PROCESSED);
    expect(results[1].type).toBe(MediaSseEventType.MEDIA_FAILED);
  });

  it('should support multiple concurrent user streams', async () => {
    const streamA$ = service.createStream('user-A');
    const streamB$ = service.createStream('user-B');

    const promiseA = firstValueFrom(streamA$.pipe(take(1)));
    const promiseB = firstValueFrom(streamB$.pipe(take(1)));

    service.pushEvent('user-A', {
      type: MediaSseEventType.MEDIA_PROCESSED,
      mediaId: 'media-forA',
      postId: 'post-1',
      timestamp: new Date().toISOString(),
    });

    service.pushEvent('user-B', {
      type: MediaSseEventType.MEDIA_FAILED,
      mediaId: 'media-forB',
      postId: 'post-2',
      timestamp: new Date().toISOString(),
    });

    const [resultA, resultB] = await Promise.all([promiseA, promiseB]);

    expect((resultA.data as MediaSseEventPayload).mediaId).toBe('media-forA');
    expect((resultB.data as MediaSseEventPayload).mediaId).toBe('media-forB');
  });

  it('should complete all streams on module destroy', async () => {
    let completed = false;
    const sub = service.createStream('user-1').subscribe({
      complete: () => {
        completed = true;
      },
    });

    service.onModuleDestroy();

    // rxjs Subject.complete() is synchronous
    expect(completed).toBe(true);
    sub.unsubscribe();
  });
});
