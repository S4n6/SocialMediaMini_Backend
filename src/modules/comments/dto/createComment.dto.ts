// src/modules/comments/dto/createComment.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  content: string;

  @IsUUID('4', { message: 'Post ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Post ID is required' })
  postId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent comment ID must be a valid UUID' })
  parentId?: string;
}
