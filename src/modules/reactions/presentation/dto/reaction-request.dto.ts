import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';
import { VALID_REACTION_TYPES } from '../../domain/value-objects/reaction-type.value-object';

export class CreateReactionRequestDto {
  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsOptional()
  @IsUUID()
  commentId?: string;

  @IsString()
  @IsIn([...VALID_REACTION_TYPES], {
    message: `Type must be one of: ${VALID_REACTION_TYPES.join(', ')}`,
  })
  type: string;
}

export class GetReactionsQueryDto {
  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsOptional()
  @IsUUID()
  commentId?: string;

  @IsOptional()
  @IsUUID()
  reactorId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['post', 'comment'])
  targetType?: 'post' | 'comment';
}
