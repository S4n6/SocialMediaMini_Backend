import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

const allowedTypes = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];

export class CreateReactionDto {
  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsOptional()
  @IsUUID()
  commentId?: string;

  @IsString()
  @IsIn(allowedTypes, {
    message: `Type must be one of: ${allowedTypes.join(', ')}`,
  })
  type: string;
}

export class UpdateReactionDto {
  @IsString()
  @IsIn(allowedTypes, {
    message: `Type must be one of: ${allowedTypes.join(', ')}`,
  })
  type: string;
}

export class GetReactionsQuery {
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
