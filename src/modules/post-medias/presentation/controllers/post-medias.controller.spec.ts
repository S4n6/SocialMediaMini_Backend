import { Test, TestingModule } from '@nestjs/testing';
import { PostMediasController } from '../controllers/post-medias.controller';
import { GenerateCloudinarySignatureUseCase } from '../../application/use-cases/generate-cloudinary-signature/generate-cloudinary-signature.use-case';
import { GenerateSignatureDto } from '../dto/generate-signature.dto';

describe('PostMediasController - Cloudinary Signature', () => {
  let controller: PostMediasController;
  let generateSignatureUseCase: GenerateCloudinarySignatureUseCase;

  const mockGenerateSignatureUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostMediasController],
      providers: [
        {
          provide: GenerateCloudinarySignatureUseCase,
          useValue: mockGenerateSignatureUseCase,
        },
      ],
    }).compile();

    controller = module.get<PostMediasController>(PostMediasController);
    generateSignatureUseCase = module.get<GenerateCloudinarySignatureUseCase>(
      GenerateCloudinarySignatureUseCase,
    );
  });

  describe('generateCloudinarySignature', () => {
    it('should generate signature with default folder', async () => {
      const mockResult = {
        signature: 'test_signature',
        timestamp: 1634567890,
        folder: 'SocialMedia/posts',
        apiKey: 'test_api_key',
        cloudName: 'test_cloud_name',
      };

      mockGenerateSignatureUseCase.execute.mockResolvedValue(mockResult);

      const dto: GenerateSignatureDto = {};
      const userId = 'user123';

      const result = await controller.generateCloudinarySignature(dto, userId);

      expect(generateSignatureUseCase.execute).toHaveBeenCalledWith({
        folder: 'SocialMediaMini/posts',
      });

      expect(result).toEqual({
        message: 'Cloudinary signature generated successfully',
        data: mockResult,
      });
    });

    it('should generate signature with custom folder', async () => {
      const customFolder = 'SocialMedia/profiles';
      const mockResult = {
        signature: 'test_signature',
        timestamp: 1634567890,
        folder: customFolder,
        apiKey: 'test_api_key',
        cloudName: 'test_cloud_name',
      };

      mockGenerateSignatureUseCase.execute.mockResolvedValue(mockResult);

      const dto: GenerateSignatureDto = { folder: customFolder };
      const userId = 'user123';

      const result = await controller.generateCloudinarySignature(dto, userId);

      expect(generateSignatureUseCase.execute).toHaveBeenCalledWith({
        folder: customFolder,
      });

      expect(result).toEqual({
        message: 'Cloudinary signature generated successfully',
        data: mockResult,
      });
    });
  });
});
