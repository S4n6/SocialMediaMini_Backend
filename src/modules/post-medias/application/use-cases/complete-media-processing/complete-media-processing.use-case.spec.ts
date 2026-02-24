import { CompleteMediaProcessingUseCase } from './complete-media-processing.use-case';
import { CompleteMediaProcessingCommand } from './complete-media-processing.command';
import { PostMediaRepository } from '../../../domain/repositories/post-media.repository';
import {
  PostMediaEntity,
  PostMediaType,
  PostMediaStatus,
} from '../../../domain/post-media.entity';
import { PostMediaNotFoundException } from '../../../domain/post-media.exceptions';

// ─── Mock Factories ────────────────────────────────────────────────

function createMockRepo(): jest.Mocked<PostMediaRepository> {
  return {
    save: jest.fn(),
    saveMany: jest.fn(),
    findById: jest.fn(),
    findByPostId: jest.fn(),
    findWithPagination: jest.fn(),
    deleteById: jest.fn(),
    deleteByPostId: jest.fn(),
    exists: jest.fn(),
    findByUrls: jest.fn(),
  } as any;
}

function createMockEventEmitter(): any {
  return {
    emit: jest.fn(),
  };
}

/**
 * Creates a PostMediaEntity in PROCESSING state (the expected state
 * when a worker callback arrives).
 */
function createProcessingMediaEntity(
  overrides?: Record<string, any>,
): PostMediaEntity {
  const entity = PostMediaEntity.fromPersistence({
    id: overrides?.id ?? 'media-123',
    url: 'https://s3.example.com/uploads/photo.jpg',
    type: PostMediaType.IMAGE,
    postId: overrides?.postId ?? 'post-456',
    order: 1,
    status: PostMediaStatus.PROCESSING,
    processedUrl: null,
    thumbnailUrl: null,
    s3Key: 'uploads/photo.jpg',
    errorMessage: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
  return entity;
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('CompleteMediaProcessingUseCase', () => {
  let useCase: CompleteMediaProcessingUseCase;
  let repo: jest.Mocked<PostMediaRepository>;
  let eventEmitter: any;

  beforeEach(() => {
    repo = createMockRepo();
    eventEmitter = createMockEventEmitter();
    useCase = new CompleteMediaProcessingUseCase(repo, eventEmitter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Success Path ──────────────────────────────────────────────

  describe('when status is success', () => {
    const command: CompleteMediaProcessingCommand = {
      mediaId: 'media-123',
      postId: 'post-456',
      status: 'success',
      processedUrl: 'https://cdn.example.com/processed/photo.webp',
      thumbnailUrl: 'https://cdn.example.com/thumbs/photo-thumb.webp',
    };

    it('should load the entity from the repository', async () => {
      const entity = createProcessingMediaEntity();
      repo.findById.mockResolvedValue(entity);
      repo.save.mockResolvedValue(entity);

      await useCase.execute(command);

      expect(repo.findById).toHaveBeenCalledWith('media-123');
    });

    it('should mark the entity as READY with processedUrl and thumbnailUrl', async () => {
      const entity = createProcessingMediaEntity();
      repo.findById.mockResolvedValue(entity);
      repo.save.mockResolvedValue(entity);

      await useCase.execute(command);

      // The entity should have been mutated before save
      expect(repo.save).toHaveBeenCalledTimes(1);
      const savedEntity = repo.save.mock.calls[0][0] as PostMediaEntity;
      expect(savedEntity.status).toBe(PostMediaStatus.READY);
      expect(savedEntity.processedUrl).toBe(command.processedUrl);
      expect(savedEntity.thumbnailUrl).toBe(command.thumbnailUrl);
      expect(savedEntity.errorMessage).toBeNull();
    });

    it('should publish domain events via EventEmitter2', async () => {
      const entity = createProcessingMediaEntity();
      repo.findById.mockResolvedValue(entity);
      repo.save.mockResolvedValue(entity);

      await useCase.execute(command);

      // markReady emits MediaProcessedEvent
      expect(eventEmitter.emit).toHaveBeenCalled();
      const [eventType] = eventEmitter.emit.mock.calls[0];
      expect(eventType).toBe('MediaProcessed');
    });

    it('should work with thumbnailUrl = undefined (null)', async () => {
      const entity = createProcessingMediaEntity();
      repo.findById.mockResolvedValue(entity);
      repo.save.mockResolvedValue(entity);

      await useCase.execute({
        ...command,
        thumbnailUrl: undefined,
      });

      const savedEntity = repo.save.mock.calls[0][0] as PostMediaEntity;
      expect(savedEntity.status).toBe(PostMediaStatus.READY);
      expect(savedEntity.thumbnailUrl).toBeNull();
    });
  });

  // ── Failure Path ──────────────────────────────────────────────

  describe('when status is failed', () => {
    const command: CompleteMediaProcessingCommand = {
      mediaId: 'media-123',
      postId: 'post-456',
      status: 'failed',
      errorMessage: 'FFmpeg exited with code 1',
    };

    it('should mark the entity as FAILED with errorMessage', async () => {
      const entity = createProcessingMediaEntity();
      repo.findById.mockResolvedValue(entity);
      repo.save.mockResolvedValue(entity);

      await useCase.execute(command);

      const savedEntity = repo.save.mock.calls[0][0] as PostMediaEntity;
      expect(savedEntity.status).toBe(PostMediaStatus.FAILED);
      expect(savedEntity.errorMessage).toBe('FFmpeg exited with code 1');
    });

    it('should use default error message when errorMessage is empty', async () => {
      const entity = createProcessingMediaEntity();
      repo.findById.mockResolvedValue(entity);
      repo.save.mockResolvedValue(entity);

      await useCase.execute({
        ...command,
        errorMessage: undefined,
      });

      const savedEntity = repo.save.mock.calls[0][0] as PostMediaEntity;
      expect(savedEntity.errorMessage).toBe('Unknown worker error');
    });

    it('should publish MediaProcessingFailed domain event', async () => {
      const entity = createProcessingMediaEntity();
      repo.findById.mockResolvedValue(entity);
      repo.save.mockResolvedValue(entity);

      await useCase.execute(command);

      expect(eventEmitter.emit).toHaveBeenCalled();
      const [eventType] = eventEmitter.emit.mock.calls[0];
      expect(eventType).toBe('MediaProcessingFailed');
    });
  });

  // ── Error Handling ────────────────────────────────────────────

  describe('error handling', () => {
    it('should throw PostMediaNotFoundException when entity does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        useCase.execute({
          mediaId: 'nonexistent',
          postId: 'post-456',
          status: 'success',
          processedUrl: 'https://cdn.example.com/x.webp',
        }),
      ).rejects.toThrow(PostMediaNotFoundException);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should throw InvalidMediaStatusTransitionException for invalid transition', async () => {
      // Entity in PENDING state — cannot go directly to READY
      const pendingEntity = PostMediaEntity.fromPersistence({
        id: 'media-pending',
        url: 'https://s3.example.com/uploads/photo.jpg',
        type: PostMediaType.IMAGE,
        postId: 'post-456',
        order: 1,
        status: PostMediaStatus.PENDING,
        processedUrl: null,
        thumbnailUrl: null,
        s3Key: 'uploads/photo.jpg',
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      repo.findById.mockResolvedValue(pendingEntity);

      await expect(
        useCase.execute({
          mediaId: 'media-pending',
          postId: 'post-456',
          status: 'success',
          processedUrl: 'https://cdn.example.com/x.webp',
        }),
      ).rejects.toThrow(); // InvalidMediaStatusTransitionException

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should not publish events when save fails', async () => {
      const entity = createProcessingMediaEntity();
      repo.findById.mockResolvedValue(entity);
      repo.save.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        useCase.execute({
          mediaId: 'media-123',
          postId: 'post-456',
          status: 'success',
          processedUrl: 'https://cdn.example.com/x.webp',
        }),
      ).rejects.toThrow('DB connection lost');

      // Events should not have been emitted since save threw
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
