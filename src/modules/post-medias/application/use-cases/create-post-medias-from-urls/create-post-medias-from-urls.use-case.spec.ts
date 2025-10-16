import { Test, TestingModule } from '@nestjs/testing';
import { CreatePostMediasFromUrlsUseCase } from './create-post-medias-from-urls.use-case';
import { PostMediaRepository } from '../../ports/repositories/post-media.repository';
import { POST_MEDIA_REPOSITORY } from '../../../tokens';
import {
  PostMediaType,
  PostMediaEntity,
} from '../../../domain/post-media.entity';
import {
  TooManyMediaFilesException,
  InvalidPostMediaException,
} from '../../../domain/post-media.exceptions';

describe('CreatePostMediasFromUrlsUseCase', () => {
  let useCase: CreatePostMediasFromUrlsUseCase;
  let repository: jest.Mocked<PostMediaRepository>;

  beforeEach(async () => {
    const mockRepository = {
      findByPostId: jest.fn(),
      saveMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostMediasFromUrlsUseCase,
        {
          provide: POST_MEDIA_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreatePostMediasFromUrlsUseCase>(
      CreatePostMediasFromUrlsUseCase,
    );
    repository = module.get(POST_MEDIA_REPOSITORY);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should create post medias from URLs successfully', async () => {
      // Arrange
      const command = {
        medias: [
          {
            url: 'https://example.com/image1.jpg',
            type: PostMediaType.IMAGE,
          },
          {
            url: 'https://example.com/video1.mp4',
            type: PostMediaType.VIDEO,
          },
        ],
        postId: 'post-id-1',
        userId: 'user-id-1',
        maxMediaPerPost: 10,
      };

      const existingMedias: PostMediaEntity[] = [];
      repository.findByPostId.mockResolvedValue(existingMedias);

      const savedMedias = command.medias.map(
        (media, index) =>
          new PostMediaEntity({
            url: media.url,
            type: media.type,
            postId: command.postId,
            order: index + 1,
          }),
      );
      repository.saveMany.mockResolvedValue(savedMedias);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.totalCreated).toBe(2);
      expect(result.medias).toHaveLength(2);
      expect(repository.findByPostId).toHaveBeenCalledWith('post-id-1');
      expect(repository.saveMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            url: 'https://example.com/image1.jpg',
            type: PostMediaType.IMAGE,
          }),
          expect.objectContaining({
            url: 'https://example.com/video1.mp4',
            type: PostMediaType.VIDEO,
          }),
        ]),
      );
    });

    it('should throw TooManyMediaFilesException when exceeding max limit', async () => {
      // Arrange
      const command = {
        medias: Array(6).fill({
          url: 'https://example.com/image.jpg',
          type: PostMediaType.IMAGE,
        }),
        postId: 'post-id-1',
        userId: 'user-id-1',
        maxMediaPerPost: 5,
      };

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        TooManyMediaFilesException,
      );
    });

    it('should throw InvalidPostMediaException for invalid URL', async () => {
      // Arrange
      const command = {
        medias: [
          {
            url: 'invalid-url',
            type: PostMediaType.IMAGE,
          },
        ],
        postId: 'post-id-1',
        userId: 'user-id-1',
      };

      repository.findByPostId.mockResolvedValue([]);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        InvalidPostMediaException,
      );
    });

    it('should assign correct order when existing medias are present', async () => {
      // Arrange
      const command = {
        medias: [
          {
            url: 'https://example.com/image1.jpg',
            type: PostMediaType.IMAGE,
          },
        ],
        postId: 'post-id-1',
        userId: 'user-id-1',
      };

      const existingMedias = [
        new PostMediaEntity({
          url: 'https://example.com/existing1.jpg',
          type: PostMediaType.IMAGE,
          postId: 'post-id-1',
          order: 1,
        }),
        new PostMediaEntity({
          url: 'https://example.com/existing2.jpg',
          type: PostMediaType.IMAGE,
          postId: 'post-id-1',
          order: 2,
        }),
      ];

      repository.findByPostId.mockResolvedValue(existingMedias);
      repository.saveMany.mockResolvedValue([
        new PostMediaEntity({
          url: command.medias[0].url,
          type: command.medias[0].type,
          postId: command.postId,
          order: 3, // Should be next after existing
        }),
      ]);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(repository.saveMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            order: 3,
          }),
        ]),
      );
    });
  });
});
