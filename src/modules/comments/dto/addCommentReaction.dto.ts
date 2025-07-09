import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class AddCommentReactionDto {
  @IsString()
  @IsNotEmpty({ message: 'Reaction type is required' })
  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'], {
    message: 'Reaction type must be one of: like, love, haha, wow, sad, angry',
  })
  reactionType: string;
}