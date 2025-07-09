import { PartialType } from '@nestjs/mapped-types';
import { CreatePostMediaDto } from './createPostMedia.dto';
import { IsOptional, IsString, IsUrl, IsIn } from 'class-validator';

export class UpdatePostMediaDto extends PartialType(CreatePostMediaDto) {}
