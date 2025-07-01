import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostMediasService } from './post-medias.service';
import { CreatePostMediaDto } from './dto/create-post-media.dto';
import { UpdatePostMediaDto } from './dto/update-post-media.dto';

@Controller('post-medias')
export class PostMediasController {
  constructor(private readonly postMediasService: PostMediasService) {}

  @Post()
  create(@Body() createPostMediaDto: CreatePostMediaDto) {
    return this.postMediasService.create(createPostMediaDto);
  }

  @Get()
  findAll() {
    return this.postMediasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postMediasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostMediaDto: UpdatePostMediaDto) {
    return this.postMediasService.update(+id, updatePostMediaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postMediasService.remove(+id);
  }
}
