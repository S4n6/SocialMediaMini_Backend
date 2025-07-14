import { IsString, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(2000, { message: 'Content cannot exceed 2000 characters' })
  content: string;
}
