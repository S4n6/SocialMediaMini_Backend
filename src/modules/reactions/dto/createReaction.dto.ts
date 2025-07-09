import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn } from 'class-validator';

export class CreateReactionDto {
  @IsString()
  @IsNotEmpty({ message: 'Reaction type is required' })
  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'], {
    message: 'Reaction type must be one of: like, love, haha, wow, sad, angry',
  })
  reactionType: string;

  @IsOptional()
  @IsUUID('4', { message: 'Post ID must be a valid UUID' })
  postId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Comment ID must be a valid UUID' })
  commentId?: string;
}
