import { Injectable, Inject } from '@nestjs/common';
import { PostMediaRepository } from '../../domain/repositories/post-media.repository';
import { PostMediaDomainService } from '../../domain/services/post-media-domain.service';

export interface ReorderPostMediasCommand {
  postId: string;
  userId: string;
  newOrders: Array<{ id: string; order: number }>;
}

@Injectable()
export class ReorderPostMediasUseCase {
  constructor(
    @Inject('POST_MEDIA_REPOSITORY')
    private readonly postMediaRepository: PostMediaRepository,
    private readonly postMediaDomainService: PostMediaDomainService,
  ) {}

  async execute(command: ReorderPostMediasCommand): Promise<void> {
    await this.postMediaDomainService.reorderPostMedias(
      command.postId,
      command.userId,
      command.newOrders,
    );
  }
}
