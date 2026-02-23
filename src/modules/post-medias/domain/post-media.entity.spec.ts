import {
  PostMediaEntity,
  PostMediaType,
  PostMediaStatus,
  PostMediaProps,
} from './post-media.entity';
import {
  InvalidMediaStatusTransitionException,
  InvalidPostMediaException,
} from './post-media.exceptions';
import {
  PostMediaCreatedEvent,
  MediaProcessingStartedEvent,
  MediaProcessedEvent,
  MediaProcessingFailedEvent,
} from './post-media.events';

// ─── Test Helpers ──────────────────────────────────────────────────

function createTestMediaProps(
  overrides?: Partial<PostMediaProps>,
): PostMediaProps {
  return {
    id: 'media-123',
    url: 'https://s3.example.com/uploads/photo.jpg',
    type: PostMediaType.IMAGE,
    postId: 'post-456',
    order: 1,
    ...overrides,
  };
}

function createTestMedia(overrides?: Partial<PostMediaProps>): PostMediaEntity {
  const entity = PostMediaEntity.fromPersistence(
    createTestMediaProps(overrides),
  );
  entity.clearEvents();
  return entity;
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('PostMediaEntity', () => {
  // ─── Construction & Defaults ────────────────────────────────────

  describe('construction', () => {
    it('should default status to PENDING when not specified', () => {
      const entity = PostMediaEntity.create({
        url: 'https://s3.example.com/uploads/photo.jpg',
        type: PostMediaType.IMAGE,
        postId: 'post-1',
        order: 1,
      });

      expect(entity.status).toBe(PostMediaStatus.PENDING);
    });

    it('should default processedUrl, thumbnailUrl, s3Key, errorMessage to null', () => {
      const entity = PostMediaEntity.create({
        url: 'https://s3.example.com/uploads/photo.jpg',
        type: PostMediaType.IMAGE,
        postId: 'post-1',
        order: 1,
      });

      expect(entity.processedUrl).toBeNull();
      expect(entity.thumbnailUrl).toBeNull();
      expect(entity.s3Key).toBeNull();
      expect(entity.errorMessage).toBeNull();
    });

    it('should preserve status when created fromPersistence', () => {
      const entity = PostMediaEntity.fromPersistence({
        ...createTestMediaProps(),
        status: PostMediaStatus.READY,
        processedUrl: 'https://cdn.example.com/processed/photo.webp',
        thumbnailUrl: 'https://cdn.example.com/processed/thumb.webp',
        s3Key: 'uploads/photo.jpg',
      });

      expect(entity.status).toBe(PostMediaStatus.READY);
      expect(entity.processedUrl).toBe(
        'https://cdn.example.com/processed/photo.webp',
      );
      expect(entity.thumbnailUrl).toBe(
        'https://cdn.example.com/processed/thumb.webp',
      );
      expect(entity.s3Key).toBe('uploads/photo.jpg');
    });

    it('should emit PostMediaCreatedEvent on construction', () => {
      const entity = PostMediaEntity.create({
        url: 'https://s3.example.com/uploads/photo.jpg',
        type: PostMediaType.IMAGE,
        postId: 'post-1',
        order: 1,
      });

      const events = entity.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PostMediaCreatedEvent);
    });
  });

  // ─── Computed Getters ───────────────────────────────────────────

  describe('isReady', () => {
    it('should return true when status is READY', () => {
      const entity = createTestMedia({ status: PostMediaStatus.READY });
      expect(entity.isReady).toBe(true);
    });

    it('should return false when status is PENDING', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PENDING });
      expect(entity.isReady).toBe(false);
    });

    it('should return false when status is PROCESSING', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });
      expect(entity.isReady).toBe(false);
    });

    it('should return false when status is FAILED', () => {
      const entity = createTestMedia({ status: PostMediaStatus.FAILED });
      expect(entity.isReady).toBe(false);
    });
  });

  describe('displayUrl', () => {
    it('should return processedUrl when available', () => {
      const entity = createTestMedia({
        status: PostMediaStatus.READY,
        processedUrl: 'https://cdn.example.com/processed/photo.webp',
      });

      expect(entity.displayUrl).toBe(
        'https://cdn.example.com/processed/photo.webp',
      );
    });

    it('should return original url when processedUrl is null', () => {
      const entity = createTestMedia({
        status: PostMediaStatus.PENDING,
        processedUrl: null,
      });

      expect(entity.displayUrl).toBe(
        'https://s3.example.com/uploads/photo.jpg',
      );
    });
  });

  // ─── markProcessing() ──────────────────────────────────────────

  describe('markProcessing', () => {
    it('should transition from PENDING to PROCESSING', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PENDING });

      entity.markProcessing();

      expect(entity.status).toBe(PostMediaStatus.PROCESSING);
    });

    it('should emit MediaProcessingStartedEvent', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PENDING });

      entity.markProcessing();

      const events = entity.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MediaProcessingStartedEvent);
    });

    it('should update updatedAt timestamp', () => {
      const oldDate = new Date('2025-01-01');
      const entity = createTestMedia({
        status: PostMediaStatus.PENDING,
        updatedAt: oldDate,
      });

      entity.markProcessing();

      expect(entity.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
    });

    it('should throw when called from PROCESSING status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });

      expect(() => entity.markProcessing()).toThrow(
        InvalidMediaStatusTransitionException,
      );
    });

    it('should throw when called from READY status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.READY });

      expect(() => entity.markProcessing()).toThrow(
        InvalidMediaStatusTransitionException,
      );
    });

    it('should throw when called from FAILED status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.FAILED });

      expect(() => entity.markProcessing()).toThrow(
        InvalidMediaStatusTransitionException,
      );
    });
  });

  // ─── markReady() ───────────────────────────────────────────────

  describe('markReady', () => {
    it('should transition from PROCESSING to READY', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });
      const processedUrl = 'https://cdn.example.com/processed/photo.webp';
      const thumbnailUrl = 'https://cdn.example.com/processed/thumb.webp';

      entity.markReady(processedUrl, thumbnailUrl);

      expect(entity.status).toBe(PostMediaStatus.READY);
      expect(entity.processedUrl).toBe(processedUrl);
      expect(entity.thumbnailUrl).toBe(thumbnailUrl);
    });

    it('should accept null thumbnailUrl', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });

      entity.markReady('https://cdn.example.com/processed/photo.webp', null);

      expect(entity.status).toBe(PostMediaStatus.READY);
      expect(entity.thumbnailUrl).toBeNull();
    });

    it('should clear errorMessage on success', () => {
      const entity = createTestMedia({
        status: PostMediaStatus.PROCESSING,
        errorMessage: 'some old error',
      });

      entity.markReady('https://cdn.example.com/processed/photo.webp', null);

      expect(entity.errorMessage).toBeNull();
    });

    it('should emit MediaProcessedEvent', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });

      entity.markReady(
        'https://cdn.example.com/processed/photo.webp',
        'https://cdn.example.com/processed/thumb.webp',
      );

      const events = entity.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MediaProcessedEvent);
    });

    it('should throw when processedUrl is empty', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });

      expect(() => entity.markReady('', null)).toThrow(
        InvalidPostMediaException,
      );
    });

    it('should throw when processedUrl is whitespace', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });

      expect(() => entity.markReady('   ', null)).toThrow(
        InvalidPostMediaException,
      );
    });

    it('should throw when called from PENDING status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PENDING });

      expect(() =>
        entity.markReady('https://cdn.example.com/photo.webp', null),
      ).toThrow(InvalidMediaStatusTransitionException);
    });

    it('should throw when called from READY status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.READY });

      expect(() =>
        entity.markReady('https://cdn.example.com/photo.webp', null),
      ).toThrow(InvalidMediaStatusTransitionException);
    });

    it('should throw when called from FAILED status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.FAILED });

      expect(() =>
        entity.markReady('https://cdn.example.com/photo.webp', null),
      ).toThrow(InvalidMediaStatusTransitionException);
    });
  });

  // ─── markFailed() ──────────────────────────────────────────────

  describe('markFailed', () => {
    it('should transition from PROCESSING to FAILED', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });

      entity.markFailed('ffmpeg transcoding error');

      expect(entity.status).toBe(PostMediaStatus.FAILED);
      expect(entity.errorMessage).toBe('ffmpeg transcoding error');
    });

    it('should emit MediaProcessingFailedEvent', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });

      entity.markFailed('timeout');

      const events = entity.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MediaProcessingFailedEvent);
    });

    it('should default to "Unknown processing error" if message is empty', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });

      entity.markFailed('');

      expect(entity.errorMessage).toBe('Unknown processing error');
    });

    it('should throw when called from PENDING status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PENDING });

      expect(() => entity.markFailed('error')).toThrow(
        InvalidMediaStatusTransitionException,
      );
    });

    it('should throw when called from READY status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.READY });

      expect(() => entity.markFailed('error')).toThrow(
        InvalidMediaStatusTransitionException,
      );
    });

    it('should throw when called from FAILED status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.FAILED });

      expect(() => entity.markFailed('error')).toThrow(
        InvalidMediaStatusTransitionException,
      );
    });
  });

  // ─── retryProcessing() ─────────────────────────────────────────

  describe('retryProcessing', () => {
    it('should transition from FAILED back to PENDING', () => {
      const entity = createTestMedia({
        status: PostMediaStatus.FAILED,
        errorMessage: 'some error',
      });

      entity.retryProcessing();

      expect(entity.status).toBe(PostMediaStatus.PENDING);
      expect(entity.errorMessage).toBeNull();
    });

    it('should throw when called from PENDING status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PENDING });

      expect(() => entity.retryProcessing()).toThrow(
        InvalidMediaStatusTransitionException,
      );
    });

    it('should throw when called from PROCESSING status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PROCESSING });

      expect(() => entity.retryProcessing()).toThrow(
        InvalidMediaStatusTransitionException,
      );
    });

    it('should throw when called from READY status', () => {
      const entity = createTestMedia({ status: PostMediaStatus.READY });

      expect(() => entity.retryProcessing()).toThrow(
        InvalidMediaStatusTransitionException,
      );
    });
  });

  // ─── Full Lifecycle ────────────────────────────────────────────

  describe('full processing lifecycle', () => {
    it('should complete happy path: PENDING → PROCESSING → READY', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PENDING });

      entity.markProcessing();
      expect(entity.status).toBe(PostMediaStatus.PROCESSING);

      entity.markReady(
        'https://cdn.example.com/processed/photo.webp',
        'https://cdn.example.com/processed/thumb.webp',
      );
      expect(entity.status).toBe(PostMediaStatus.READY);
      expect(entity.isReady).toBe(true);
      expect(entity.displayUrl).toBe(
        'https://cdn.example.com/processed/photo.webp',
      );
    });

    it('should complete failure path: PENDING → PROCESSING → FAILED', () => {
      const entity = createTestMedia({ status: PostMediaStatus.PENDING });

      entity.markProcessing();
      entity.markFailed('out of memory');

      expect(entity.status).toBe(PostMediaStatus.FAILED);
      expect(entity.errorMessage).toBe('out of memory');
      expect(entity.isReady).toBe(false);
    });

    it('should complete retry path: FAILED → PENDING → PROCESSING → READY', () => {
      const entity = createTestMedia({
        status: PostMediaStatus.FAILED,
        errorMessage: 'temporary error',
      });

      entity.retryProcessing();
      expect(entity.status).toBe(PostMediaStatus.PENDING);
      expect(entity.errorMessage).toBeNull();

      entity.markProcessing();
      entity.markReady('https://cdn.example.com/processed/photo.webp', null);

      expect(entity.status).toBe(PostMediaStatus.READY);
      expect(entity.isReady).toBe(true);
    });
  });

  // ─── toPlainObject ─────────────────────────────────────────────

  describe('toPlainObject', () => {
    it('should include all new fields', () => {
      const entity = createTestMedia({
        status: PostMediaStatus.READY,
        processedUrl: 'https://cdn.example.com/processed/photo.webp',
        thumbnailUrl: 'https://cdn.example.com/processed/thumb.webp',
        s3Key: 'uploads/photo.jpg',
        errorMessage: null,
      });

      const plain = entity.toPlainObject();

      expect(plain.status).toBe(PostMediaStatus.READY);
      expect(plain.processedUrl).toBe(
        'https://cdn.example.com/processed/photo.webp',
      );
      expect(plain.thumbnailUrl).toBe(
        'https://cdn.example.com/processed/thumb.webp',
      );
      expect(plain.s3Key).toBe('uploads/photo.jpg');
      expect(plain.errorMessage).toBeNull();
    });
  });
});
