import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { CreateReactionDto } from './dto/createReaction.dto';
import { CurrentUser } from 'src/decorators/currentUser.decorator';

@Controller('reactions')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  async create(
    @Body() createReactionDto: CreateReactionDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.reactionsService.create(
      createReactionDto,
      userId,
    );

    return {
      message: 'Reaction processed successfully',
      data: result,
    };
  }

  @Get()
  async findAll() {
    const result = await this.reactionsService.findAll();

    return {
      message: 'All likes retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.reactionsService.findOne(id);

    return {
      message: 'Like retrieved successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.reactionsService.remove(id, userId);

    return {
      message: 'Like removed successfully',
      data: result,
    };
  }

  @Get('post/:postId')
  async getPostLikes(@Param('postId') postId: string) {
    const result = await this.reactionsService.getPostLikes(postId);

    return {
      message: 'Post likes retrieved successfully',
      data: result,
    };
  }

  @Get('post/:postId/check/:userId')
  async checkUserLiked(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ) {
    const result = await this.reactionsService.checkUserLiked(postId, userId);

    return {
      message: 'User like status retrieved successfully',
      data: result,
    };
  }

  @Get('post/:postId/my-status')
  async checkMyLikeStatus(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.reactionsService.checkUserLiked(postId, userId);

    return {
      message: 'Your like status retrieved successfully',
      data: result,
    };
  }
}
