import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { WorkerSecretGuard } from '../../../../shared/guards/worker-secret.guard';
import { CompleteMediaProcessingUseCase } from '../../application/use-cases/complete-media-processing/complete-media-processing.use-case';
import {
  MediaProcessingCallbackDto,
  MediaCallbackStatus,
} from '../dto/media-processing-callback.dto';

/**
 * Internal controller for worker callbacks.
 *
 * Endpoints here are NOT behind JWT auth — they are protected
 * by the WorkerSecretGuard (shared secret in x-worker-secret header).
 */
@ApiTags('Internal / Media Processing')
@Controller('internal/media')
export class MediaCallbackController {
  private readonly logger = new Logger(MediaCallbackController.name);

  constructor(
    private readonly completeMediaProcessing: CompleteMediaProcessingUseCase,
  ) {}

  /**
   * Called by the Go worker after processing a media file.
   */
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WorkerSecretGuard)
  @ApiOperation({
    summary: 'Media processing callback (internal)',
    description:
      'Receives the result of media processing from the Go worker. ' +
      'Protected by x-worker-secret header.',
  })
  @ApiHeader({
    name: 'x-worker-secret',
    description: 'Shared secret for worker authentication',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Callback processed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing worker secret' })
  @ApiResponse({ status: 404, description: 'Media entity not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async handleCallback(
    @Body() dto: MediaProcessingCallbackDto,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `Received callback for media ${dto.mediaId} — status: ${dto.status}`,
    );

    await this.completeMediaProcessing.execute({
      mediaId: dto.mediaId,
      postId: dto.postId,
      status: dto.status as 'success' | 'failed',
      processedUrl: dto.processedUrl,
      thumbnailUrl: dto.thumbnailUrl,
      errorMessage: dto.errorMessage,
    });

    const message =
      dto.status === MediaCallbackStatus.SUCCESS
        ? `Media ${dto.mediaId} marked as ready`
        : `Media ${dto.mediaId} marked as failed`;

    return { success: true, message };
  }
}
