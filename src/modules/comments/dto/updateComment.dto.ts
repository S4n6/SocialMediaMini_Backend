import { PartialType } from '@nestjs/mapped-types';

import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { CreateCommentDto } from './createComment.dto';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  content?: string;
}
