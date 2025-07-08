import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PostMediasService } from './postMedias.service';
import { CreatePostMediaDto } from './dto/createPostMedia.dto';
import { UpdatePostMediaDto } from './dto/updatePostMedia.dto';

@Controller('post-medias')
export class PostMediasController {
  constructor(private readonly postMediasService: PostMediasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPostMediaDto: CreatePostMediaDto) {
    return this.postMediasService.create(createPostMediaDto);
  }

  @Get()
  findAll() {
    return this.postMediasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postMediasService.findOne(id);
  }

  @Get('post/:postId')
  findByPost(@Param('postId') postId: string) {
    return this.postMediasService.findByPost(postId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostMediaDto: UpdatePostMediaDto,
  ) {
    return this.postMediasService.update(id, updatePostMediaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.postMediasService.remove(id);
  }

  @Delete('post/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeByPost(@Param('postId') postId: string) {
    return this.postMediasService.removeByPost(postId);
  }
}
