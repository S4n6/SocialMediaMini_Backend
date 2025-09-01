import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

const allowedTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

export class CreateReactionDto {
  @IsOptional()
  @IsUUID()
  postId?: string;

  @IsOptional()
  @IsUUID()
  commentId?: string;

  @IsString()
  @IsIn(allowedTypes)
  type: string;
}
