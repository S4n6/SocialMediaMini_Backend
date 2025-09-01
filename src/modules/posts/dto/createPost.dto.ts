import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Content cannot exceed 2000 characters' })
  @IsNotEmpty({ message: 'Content cannot be empty when provided' })
  content?: string;

  @IsString()
  @IsOptional()
  @IsString()
  @IsIn(['public', 'followers', 'private'], {
    message: 'Privacy must be one of: public, followers, private',
  })
  privacy?: string;
}
