import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { CreateReactionDto } from './createReaction.dto';

export class UpdateReactionDto extends PartialType(CreateReactionDto) {
  @IsOptional()
  @IsString()
  @IsIn(['like', 'love', 'haha', 'wow', 'sad', 'angry'], {
    message: 'Reaction type must be one of: like, love, haha, wow, sad, angry',
  })
  reactionType?: string;
}
