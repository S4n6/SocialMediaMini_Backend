import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../constants/roles.constant';
import { CreateReactionDto } from './dto/createReaction.dto';
import { UpdateReactionDto } from './dto/updateReaction.dto';
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
      message: 'Reaction added successfully',
      data: result,
    };
    
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.reactionsService.findAll(page, limit);

    return {
      message: 'Reactions retrieved successfully',
      data: result.reactions,
      pagination: result.pagination,
    };
  }

  @Get('post/:postId')
  async findByPost(
    @Param('postId') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.reactionsService.findByPost(postId, page, limit);

    return {
      message: 'Post reactions retrieved successfully',
      data: result.reactions,
      pagination: result.pagination,
    };
  }

  @Get('comment/:commentId')
  async findByComment(
    @Param('commentId') commentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.reactionsService.findByComment(
      commentId,
      page,
      limit,
    );

    return {
      message: 'Comment reactions retrieved successfully',
      data: result.reactions,
      pagination: result.pagination,
    };
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.reactionsService.findByUser(userId, page, limit);

    return {
      message: 'User reactions retrieved successfully',
      data: result.reactions,
      pagination: result.pagination,
    };
  }

  @Get('my-reactions')
  async findMyReactions(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.reactionsService.findByUser(userId, page, limit);

    return {
      message: 'My reactions retrieved successfully',
      data: result.reactions,
      pagination: result.pagination,
    };
  }

  @Get('stats/post/:postId')
  async getPostReactionStats(@Param('postId') postId: string) {
    const result = await this.reactionsService.getReactionStats(postId);

    return {
      message: 'Post reaction statistics retrieved successfully',
      data: result,
    };
  }

  @Get('stats/comment/:commentId')
  async getCommentReactionStats(@Param('commentId') commentId: string) {
    const result = await this.reactionsService.getReactionStats(
      undefined,
      commentId,
    );

    return {
      message: 'Comment reaction statistics retrieved successfully',
      data: result,
    };
  }

  @Get('check/post/:postId')
  async checkPostReaction(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.reactionsService.getUserReaction(userId, postId);

    return {
      message: 'User reaction status retrieved successfully',
      data: result,
      hasReacted: !!result,
    };
  }

  @Get('check/comment/:commentId')
  async checkCommentReaction(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.reactionsService.getUserReaction(
      userId,
      undefined,
      commentId,
    );

    return {
      message: 'User reaction status retrieved successfully',
      data: result,
      hasReacted: !!result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.reactionsService.findOne(id);

    return {
      message: 'Reaction retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReactionDto: UpdateReactionDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.reactionsService.update(
      id,
      updateReactionDto,
      userId,
    );

    return {
      message: 'Reaction updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.reactionsService.remove(id, userId);

    return result;
  }

  @Delete('post/:postId/user')
  async removePostReaction(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.reactionsService.removeByTarget(
      postId,
      undefined,
      userId,
    );

    return result;
  }

  @Delete('comment/:commentId/user')
  async removeCommentReaction(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.reactionsService.removeByTarget(
      undefined,
      commentId,
      userId,
    );

    return result;
  }

  // Admin only endpoints
  @Delete('post/:postId/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async removeAllPostReactions(@Param('postId') postId: string) {
    // This would need a new service method to remove all reactions for a post
    return {
      message: 'Feature not implemented yet',
    };
  }

  @Delete('comment/:commentId/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async removeAllCommentReactions(@Param('commentId') commentId: string) {
    // This would need a new service method to remove all reactions for a comment
    return {
      message: 'Feature not implemented yet',
    };
  }

  @Get('stats/overall')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getOverallStats() {
    const result = await this.reactionsService.getReactionStats();

    return {
      message: 'Overall reaction statistics retrieved successfully',
      data: result,
    };
  }
}
