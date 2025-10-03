import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConversationUseCases } from '../../application/use-cases/conversation.use-cases';
import { MessagingApplicationServices } from '../../application/services/messaging-application.services';
import {
  CreatePrivateConversationDto,
  CreateGroupConversationDto,
  UpdateConversationTitleDto,
  AddParticipantDto,
  GetConversationsQueryDto,
  ConversationResponseDto,
  ConversationWithLastMessageDto,
} from '../dto/conversation.dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly conversationUseCases: ConversationUseCases,
    private readonly messagingServices: MessagingApplicationServices,
  ) {}

  // Safely extract user id from request which may come from different auth strategies
  private getUserId(req: unknown): string | undefined {
    if (!req || typeof req !== 'object') return undefined;
    const r = req as Record<string, unknown>;
    const user = r.user as Record<string, unknown> | undefined;
    if (!user) return undefined;
    const id = user.id ?? user.sub;
    return typeof id === 'string' ? id : undefined;
  }

  private getErrorMessage(err: unknown): string {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    try {
      return JSON.stringify(err as any);
    } catch {
      return String(err);
    }
  }

  @Post('private')
  @ApiOperation({ summary: 'Create a private conversation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Private conversation created successfully',
    schema: {
      type: 'object',
      properties: { conversationId: { type: 'string' } },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or conversation already exists',
  })
  async createPrivateConversation(
    @Body() dto: CreatePrivateConversationDto,
    @Request() req: unknown,
  ) {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      // Validate that current user is one of the participants
      if (!dto.participantIds.includes(userId)) {
        throw new ForbiddenException(
          'You must be a participant in the conversation',
        );
      }

      const conversationId =
        await this.conversationUseCases.createPrivateConversation({
          participantIds: dto.participantIds,
          createdBy: userId,
        });

      return { conversationId };
    } catch (error) {
      const _err = this.getErrorMessage(error);
      if (_err.includes('already exists')) {
        throw new BadRequestException(
          'Private conversation already exists between these users',
        );
      }
      throw error;
    }
  }

  @Post('group')
  @ApiOperation({ summary: 'Create a group conversation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Group conversation created successfully',
    schema: {
      type: 'object',
      properties: { conversationId: { type: 'string' } },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  async createGroupConversation(
    @Body() dto: CreateGroupConversationDto,
    @Request() req: unknown,
  ) {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const conversationId = await this.messagingServices.createGroupChat(
        dto.title,
        userId,
        dto.participantIds,
      );

      return { conversationId };
    } catch (error) {
      throw new BadRequestException(this.getErrorMessage(error));
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get user conversations with last messages' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversations retrieved successfully',
    type: [ConversationWithLastMessageDto],
  })
  async getUserConversations(
    @Query() query: GetConversationsQueryDto,
    @Request() req: unknown,
  ): Promise<ConversationWithLastMessageDto[]> {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      return await this.messagingServices.getUserConversationsWithLastMessage(
        userId,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation retrieved successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getConversationById(
    @Param('id') id: string,
    @Request() req: unknown,
  ): Promise<ConversationResponseDto> {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const conversation = await this.conversationUseCases.getConversationById(
        id,
        userId,
      );
      if (!conversation) {
        throw new NotFoundException('Conversation not found or access denied');
      }

      return conversation.toPrimitives() as ConversationResponseDto;
    } catch (error) {
      const _err = this.getErrorMessage(error);
      if (_err.includes('not found')) {
        throw new NotFoundException(_err);
      }
      if (_err.includes('access')) {
        throw new ForbiddenException(_err);
      }
      throw error;
    }
  }

  @Put(':id/title')
  @ApiOperation({ summary: 'Update conversation title' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation title updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async updateConversationTitle(
    @Param('id') id: string,
    @Body() dto: UpdateConversationTitleDto,
    @Request() req: unknown,
  ) {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.conversationUseCases.updateConversationTitle({
        conversationId: id,
        title: dto.title,
        updatedBy: userId,
      });

      return { message: 'Conversation title updated successfully' };
    } catch (error) {
      const _err = this.getErrorMessage(error);
      if (_err.includes('not found')) {
        throw new NotFoundException(_err);
      }
      if (_err.includes('access') || _err.includes('privileges')) {
        throw new ForbiddenException(_err);
      }
      throw error;
    }
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add participant to conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participant added successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied or insufficient privileges',
  })
  async addParticipant(
    @Param('id') id: string,
    @Body() dto: AddParticipantDto,
    @Request() req: unknown,
  ) {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.conversationUseCases.addParticipant({
        conversationId: id,
        userId: dto.userId,
        addedBy: userId,
      });

      return { message: 'Participant added successfully' };
    } catch (error) {
      const _err = this.getErrorMessage(error);
      if (_err.includes('not found')) {
        throw new NotFoundException(_err);
      }
      if (_err.includes('access') || _err.includes('privileges')) {
        throw new ForbiddenException(_err);
      }
      throw new BadRequestException(_err);
    }
  }

  @Delete(':id/participants/:userId')
  @ApiOperation({ summary: 'Remove participant from conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiParam({ name: 'userId', description: 'User ID to remove' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participant removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied or insufficient privileges',
  })
  async removeParticipant(
    @Param('id') id: string,
    @Param('userId') participantUserId: string,
    @Request() req: unknown,
  ) {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.conversationUseCases.removeParticipant({
        conversationId: id,
        userId: participantUserId,
        removedBy: userId,
      });

      return { message: 'Participant removed successfully' };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      if (
        error.message.includes('access') ||
        error.message.includes('privileges')
      ) {
        throw new ForbiddenException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave group conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Left conversation successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  async leaveConversation(@Param('id') id: string, @Request() req: unknown) {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.messagingServices.leaveGroupConversation(id, userId);
      return { message: 'Left conversation successfully' };
    } catch (error) {
      const _err = this.getErrorMessage(error);
      if (_err.includes('not found')) {
        throw new NotFoundException(_err);
      }
      throw new BadRequestException(_err);
    }
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation archived successfully',
  })
  async archiveConversation(@Param('id') id: string, @Request() req: unknown) {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.conversationUseCases.archiveConversation(id, userId);
      return { message: 'Conversation archived successfully' };
    } catch (error) {
      const _err = this.getErrorMessage(error);
      if (_err.includes('not found')) {
        throw new NotFoundException(_err);
      }
      if (_err.includes('access')) {
        throw new ForbiddenException(_err);
      }
      throw error;
    }
  }

  @Post(':id/unarchive')
  @ApiOperation({ summary: 'Unarchive conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation unarchived successfully',
  })
  async unarchiveConversation(
    @Param('id') id: string,
    @Request() req: unknown,
  ) {
    try {
      const userId = this.getUserId(req);
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.conversationUseCases.unarchiveConversation(id, userId);
      return { message: 'Conversation unarchived successfully' };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('access')) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }
}
