import { MediaProcessingSubscriber } from './media-processing.subscriber';
import { PostService } from '../../domain/services/post.service';
import {
  MediaProcessedEvent,
  MediaProcessingFailedEvent,
} from '../../domain/post-media.events';
import {
  MediaSseService,
  MediaSseEventType,
} from '../../infrastructure/services/media-sse.service';

describe('MediaProcessingSubscriber', () => {
  let subscriber: MediaProcessingSubscriber;
  let mockPostService: jest.Mocked<PostService>;
  let mockSseService: jest.Mocked<MediaSseService>;

  beforeEach(() => {
    mockPostService = {
      exists: jest.fn(),
      belongsToUser: jest.fn(),
      getOwnerUserId: jest.fn(),
    };

    mockSseService = {
      createStream: jest.fn(),
      pushEvent: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as any;

    subscriber = new MediaProcessingSubscriber(mockPostService, mockSseService);
  });

  // ─── MediaProcessed ────────────────────────────────────────────────

  describe('onMediaProcessed', () => {
    it('should push SSE event to post owner on success', async () => {
      mockPostService.getOwnerUserId.mockResolvedValue('user-123');

      const event = new MediaProcessedEvent(
        'media-1',
        'post-1',
        'https://cdn.example.com/processed/img.jpg',
        'https://cdn.example.com/processed/thumb.jpg',
      );

      await subscriber.onMediaProcessed(event);

      expect(mockPostService.getOwnerUserId).toHaveBeenCalledWith('post-1');
      expect(mockSseService.pushEvent).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          type: MediaSseEventType.MEDIA_PROCESSED,
          mediaId: 'media-1',
          postId: 'post-1',
          processedUrl: 'https://cdn.example.com/processed/img.jpg',
          thumbnailUrl: 'https://cdn.example.com/processed/thumb.jpg',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should handle null thumbnailUrl', async () => {
      mockPostService.getOwnerUserId.mockResolvedValue('user-123');

      const event = new MediaProcessedEvent(
        'media-2',
        'post-2',
        'https://cdn.example.com/processed/vid.mp4',
        null,
      );

      await subscriber.onMediaProcessed(event);

      expect(mockSseService.pushEvent).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          thumbnailUrl: null,
        }),
      );
    });

    it('should skip SSE push when post owner not found', async () => {
      mockPostService.getOwnerUserId.mockResolvedValue(null);

      const event = new MediaProcessedEvent(
        'media-3',
        'deleted-post',
        'https://cdn.example.com/img.jpg',
        null,
      );

      await subscriber.onMediaProcessed(event);

      expect(mockSseService.pushEvent).not.toHaveBeenCalled();
    });
  });

  // ─── MediaProcessingFailed ─────────────────────────────────────────

  describe('onMediaProcessingFailed', () => {
    it('should push SSE failure event to post owner', async () => {
      mockPostService.getOwnerUserId.mockResolvedValue('user-456');

      const event = new MediaProcessingFailedEvent(
        'media-4',
        'post-4',
        'Unsupported format',
      );

      await subscriber.onMediaProcessingFailed(event);

      expect(mockPostService.getOwnerUserId).toHaveBeenCalledWith('post-4');
      expect(mockSseService.pushEvent).toHaveBeenCalledWith(
        'user-456',
        expect.objectContaining({
          type: MediaSseEventType.MEDIA_FAILED,
          mediaId: 'media-4',
          postId: 'post-4',
          errorMessage: 'Unsupported format',
          timestamp: expect.any(String),
        }),
      );
    });

    it('should skip SSE push when post owner not found', async () => {
      mockPostService.getOwnerUserId.mockResolvedValue(null);

      const event = new MediaProcessingFailedEvent(
        'media-5',
        'gone-post',
        'Processing timeout',
      );

      await subscriber.onMediaProcessingFailed(event);

      expect(mockSseService.pushEvent).not.toHaveBeenCalled();
    });
  });
});
