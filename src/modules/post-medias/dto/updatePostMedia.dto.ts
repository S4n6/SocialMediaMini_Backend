import { PartialType } from '@nestjs/mapped-types';
import { CreatePostMediaDto } from './createPostMedia.dto';

export class UpdatePostMediaDto extends PartialType(CreatePostMediaDto) {}
