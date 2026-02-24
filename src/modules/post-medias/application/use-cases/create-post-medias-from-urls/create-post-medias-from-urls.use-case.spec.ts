import { CreatePostMediasFromUrlsUseCase } from './create-post-medias-from-urls.use-case';
import { CreatePostMediasFromUrlsCommand } from './create-post-medias-from-urls.command';
import { PostMediaRepository } from '../../../domain/repositories/post-media.repository';
import {
  PostMediaEntity,
  PostMediaType,
  PostMediaStatus,
} from '../../../domain/post-media.entity';
import { IMessagePublisher } from '../../../../../infrastructure/message-queue/ports/i-message-publisher.port';
import {
  TooManyMediaFilesException,
  InvalidPostMediaException,
} from '../../../domain/post-media.exceptions';

// ─── Mock Factories ────────────────────────────────────────────────

function createMockRepository(): jest.Mocked<PostMediaRepository> {
  return {
    save: jest.fn(),
    saveMany: jest.fn(),
    findById: jest.fn(),
    findByPostId: jest.fn(),
    findWithPagination: jest.fn(),
    deleteById: jest.fn(),
    deleteByPostId: jest.fn(),
    exists: jest.fn(),
    countByPostId: jest.fn(),
    updateOrdersByPostId: jest.fn(),
    findByUrls: jest.fn(),
  };
}

function createMockPublisher(): jest.Mocked<IMessagePublisher> {
  return {
    publish: jest.fn().mockResolvedValue(true),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
}

function buildCommand(
  overrides?: Partial<CreatePostMediasFromUrlsCommand>,
): CreatePostMediasFromUrlsCommand {
  return {
    postId: 'post-123',
    userId: 'user-456',
    medias: [
      {
        url: 'https://s3.example.com/uploads/photo.jpg',
        type: PostMediaType.IMAGE,
        s3Key: 'uploads/1708000000-photo.jpg',
      },
    ],
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('CreatePostMediasFromUrlsUseCase', () => {
  let useCase: CreatePostMediasFromUrlsUseCase;
  let mockRepo: jest.Mocked<PostMediaRepository>;
  let mockPublisher: jest.Mocked<IMessagePublisher>;

  beforeEach(() => {
    mockRepo = createMockRepository();
    mockPublisher = createMockPublisher();
    useCase = new CreatePostMediasFromUrlsUseCase(mockRepo, mockPublisher);

    // Default: no existing medias for the post
    mockRepo.findByPostId.mockResolvedValue([]);

    // Default: saveMany returns entities with proper IDs
    mockRepo.saveMany.mockImplementation(async (entities) =>
      entities.map((e) =>
        PostMediaEntity.fromPersistence({
          id: e.id,
          url: e.url,
          type: e.type,
          postId: e.postId,
          order: e.order,
          status: PostMediaStatus.PENDING,
          processedUrl: null,
          thumbnailUrl: null,
          s3Key: e.s3Key,
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    );
  });

  // ─── Happy Path ──────────────────────────────────────────────

  describe('successful creation', () => {
    it('should save medias and return them', async () => {
      const command = buildCommand();

      const result = await useCase.execute(command);

      expect(mockRepo.saveMany).toHaveBeenCalledTimes(1);
      expect(result.totalCreated).toBe(1);
      expect(result.medias).toHaveLength(1);
      expect(result.medias[0].status).toBe(PostMediaStatus.PENDING);
    });

    it('should publish a process_media message per saved media', async () => {
      const command = buildCommand({
        medias: [
          {
            url: 'https://s3.example.com/uploads/photo.jpg',
            type: PostMediaType.IMAGE,
            s3Key: 'uploads/1708000000-photo.jpg',
          },
          {
            url: 'https://s3.example.com/uploads/video.mp4',
            type: PostMediaType.VIDEO,
            s3Key: 'uploads/1708000000-video.mp4',
          },
        ],
      });

      await useCase.execute(command);

      expect(mockPublisher.publish).toHaveBeenCalledTimes(2);

      // Verify first message
      const firstCall = mockPublisher.publish.mock.calls[0][0] as any;
      expect(firstCall.type).toBe('process_media');
      expect(firstCall.payload.s3_key).toBe('uploads/1708000000-photo.jpg');
      expect(firstCall.payload.media_type).toBe('image');
      expect(firstCall.payload.post_id).toBe('post-123');
      expect(firstCall.payload.user_id).toBe('user-456');

      // Verify second message
      const secondCall = mockPublisher.publish.mock.calls[1][0] as any;
      expect(secondCall.type).toBe('process_media');
      expect(secondCall.payload.s3_key).toBe('uploads/1708000000-video.mp4');
      expect(secondCall.payload.media_type).toBe('video');
    });

    it('should include media_id from the saved entity in the published message', async () => {
      const command = buildCommand();

      const result = await useCase.execute(command);

      const publishedMessage = mockPublisher.publish.mock.calls[0][0] as any;
      expect(publishedMessage.payload.media_id).toBe(result.medias[0].id);
    });

    it('should pass s3Key to the entity constructor', async () => {
      const command = buildCommand({
        medias: [
          {
            url: 'https://s3.example.com/uploads/photo.jpg',
            type: PostMediaType.IMAGE,
            s3Key: 'uploads/my-key.jpg',
          },
        ],
      });

      await useCase.execute(command);

      // Verify the entity passed to saveMany has the s3Key
      const savedEntities = mockRepo.saveMany.mock.calls[0][0];
      expect(savedEntities[0].s3Key).toBe('uploads/my-key.jpg');
    });
  });

  // ─── Publisher Resilience ────────────────────────────────────

  describe('publisher failure resilience', () => {
    it('should not fail the request if publish throws', async () => {
      mockPublisher.publish.mockRejectedValue(
        new Error('RabbitMQ connection lost'),
      );

      const command = buildCommand();

      // Should not throw — publishing is non-critical
      const result = await useCase.execute(command);

      expect(result.totalCreated).toBe(1);
      expect(mockRepo.saveMany).toHaveBeenCalledTimes(1);
    });

    it('should still save all medias even if some publishes fail', async () => {
      mockPublisher.publish
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('broker down'));

      const command = buildCommand({
        medias: [
          {
            url: 'https://s3.example.com/uploads/a.jpg',
            type: PostMediaType.IMAGE,
            s3Key: 'uploads/a.jpg',
          },
          {
            url: 'https://s3.example.com/uploads/b.jpg',
            type: PostMediaType.IMAGE,
            s3Key: 'uploads/b.jpg',
          },
        ],
      });

      const result = await useCase.execute(command);

      expect(result.totalCreated).toBe(2);
      expect(mockPublisher.publish).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Validation ──────────────────────────────────────────────

  describe('validation', () => {
    it('should throw if s3Key is empty', async () => {
      const command = buildCommand({
        medias: [
          {
            url: 'https://s3.example.com/uploads/photo.jpg',
            type: PostMediaType.IMAGE,
            s3Key: '',
          },
        ],
      });

      await expect(useCase.execute(command)).rejects.toThrow(
        InvalidPostMediaException,
      );
    });

    it('should throw if s3Key is whitespace', async () => {
      const command = buildCommand({
        medias: [
          {
            url: 'https://s3.example.com/uploads/photo.jpg',
            type: PostMediaType.IMAGE,
            s3Key: '   ',
          },
        ],
      });

      await expect(useCase.execute(command)).rejects.toThrow(
        InvalidPostMediaException,
      );
    });

    it('should throw if too many medias', async () => {
      const medias = Array.from({ length: 11 }, (_, i) => ({
        url: `https://s3.example.com/uploads/${i}.jpg`,
        type: PostMediaType.IMAGE,
        s3Key: `uploads/${i}.jpg`,
      }));

      await expect(useCase.execute(buildCommand({ medias }))).rejects.toThrow(
        TooManyMediaFilesException,
      );
    });

    it('should throw if URL format is invalid', async () => {
      const command = buildCommand({
        medias: [
          {
            url: 'not-a-url',
            type: PostMediaType.IMAGE,
            s3Key: 'uploads/photo.jpg',
          },
        ],
      });

      await expect(useCase.execute(command)).rejects.toThrow(
        InvalidPostMediaException,
      );
    });

    it('should not publish if validation fails', async () => {
      const command = buildCommand({
        medias: [
          {
            url: 'not-a-url',
            type: PostMediaType.IMAGE,
            s3Key: 'uploads/photo.jpg',
          },
        ],
      });

      await expect(useCase.execute(command)).rejects.toThrow();
      expect(mockPublisher.publish).not.toHaveBeenCalled();
    });
  });
});
