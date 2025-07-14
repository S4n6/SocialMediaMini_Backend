import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './createPost.dto';
import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Content cannot be empty' })
  @MaxLength(2000, { message: 'Content cannot exceed 2000 characters' })
  content?: string;
}
