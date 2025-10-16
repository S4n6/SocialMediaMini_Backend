import { Injectable, Inject } from '@nestjs/common';
import { CLOUDINARY_SERVICE } from '../../../tokens';
import { CloudinaryService } from '../../ports/services/cloudinary.service';
import { CleanupMediaCommand } from './cleanup-media.command';
import { CleanupMediaResponse } from './cleanup-media.response';

@Injectable()
export class CleanupMediaUseCase {
  constructor(
    @Inject(CLOUDINARY_SERVICE)
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async execute(command: CleanupMediaCommand): Promise<CleanupMediaResponse> {
    const { publicIds, userId } = command;

    let deletedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Delete files from Cloudinary in parallel
    const deletePromises = publicIds.map(async (publicId) => {
      try {
        await this.cloudinaryService.deleteFile(publicId);
        deletedCount++;
        return { success: true, publicId };
      } catch (error) {
        failedCount++;
        const errorMessage = `Failed to delete ${publicId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMessage);
        return { success: false, publicId, error: errorMessage };
      }
    });

    await Promise.all(deletePromises);

    return {
      deletedCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
