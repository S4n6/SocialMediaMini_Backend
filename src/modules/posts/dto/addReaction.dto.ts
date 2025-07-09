import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class AddReactionDto {
  @IsString()
  @IsNotEmpty({ message: 'Reaction type is required' })
  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'], {
    message: 'Reaction type must be one of: like, love, haha, wow, sad, angry',
  })
  reactionType: string;
}