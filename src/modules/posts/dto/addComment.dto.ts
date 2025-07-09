import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AddCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required' })
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  content: string;
}