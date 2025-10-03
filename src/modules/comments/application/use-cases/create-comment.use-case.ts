import { Injectable, Inject } from '@nestjs/common';
import { CommentDomainService } from '../../domain/services/comment-domain.service';
import { CommentEntity } from '../../domain/comment.entity';

export interface CreateCommentCommand {
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
}

@Injectable()
export class CreateCommentUseCase {
  constructor(private readonly commentDomainService: CommentDomainService) {}

  async execute(command: CreateCommentCommand): Promise<CommentEntity> {
    return await this.commentDomainService.createComment(
      command.content,
      command.authorId,
      command.postId,
      command.parentId,
    );
  }
}
