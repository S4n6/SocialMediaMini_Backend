import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  // UseGuards,
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

// Minimal request shape for authenticated requests (only what's used here)
type AuthRequest = { user?: { id?: string; sub?: string } };

function getErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err as any);
  } catch {
    // Avoid default object stringification which yields '[object Object]'.
    // Use Object.prototype.toString to provide an explicit, lint-friendly fallback.
    return Object.prototype.toString.call(err);
  }
}
import { MessageUseCases } from '../../application/use-cases/message.use-cases';
import { MessagingApplicationServices } from '../../application/services/messaging-application.services';
import {
  SendTextMessageDto,
  SendMediaMessageDto,
  SendReplyMessageDto,
  EditMessageDto,
  AddReactionDto,
  GetMessagesQueryDto,
  MessageResponseDto,
  MessagesResponseDto,
  ConversationWithMessagesDto,
} from '../dto/message.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller()
export class MessageController {
  constructor(
    private readonly messageUseCases: MessageUseCases,
    private readonly messagingServices: MessagingApplicationServices,
  ) {}

  @Post('conversations/:conversationId/messages/text')
  @ApiOperation({ summary: 'Send a text message' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Text message sent successfully',
    schema: { type: 'object', properties: { messageId: { type: 'string' } } },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async sendTextMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendTextMessageDto,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const messageId = await this.messageUseCases.sendTextMessage({
        conversationId,
        senderId: userId,
        content: dto.content,
      });

      return { messageId };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('access')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Post('conversations/:conversationId/messages/media')
  @ApiOperation({ summary: 'Send a media message' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Media message sent successfully',
    schema: { type: 'object', properties: { messageId: { type: 'string' } } },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async sendMediaMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMediaMessageDto,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const messageId = await this.messageUseCases.sendMediaMessage({
        conversationId,
        senderId: userId,
        type: dto.type,
        attachmentUrl: dto.attachmentUrl,
        content: dto.content,
      });

      return { messageId };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('access')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Post('conversations/:conversationId/messages/reply')
  @ApiOperation({ summary: 'Send a reply message' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reply message sent successfully',
    schema: { type: 'object', properties: { messageId: { type: 'string' } } },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation or reply target message not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async sendReplyMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendReplyMessageDto,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const messageId = await this.messageUseCases.sendReplyMessage({
        conversationId,
        senderId: userId,
        content: dto.content,
        replyToMessageId: dto.replyToMessageId,
      });

      return { messageId };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('access')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully',
    type: MessagesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesQueryDto,
    @Request() req: AuthRequest,
  ): Promise<MessagesResponseDto> {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const result = await this.messageUseCases.getConversationMessages({
        conversationId,
        userId,
        limit: query.limit,
        cursor: query.cursor,
      });

      return {
        messages: result.messages.map((msg) =>
          msg.toPrimitives(),
        ) as MessageResponseDto[],
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
      };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('access')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Get('conversations/:conversationId/with-messages')
  @ApiOperation({ summary: 'Get conversation with messages in one request' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversation with messages retrieved successfully',
    type: ConversationWithMessagesDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async getConversationWithMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesQueryDto,
    @Request() req: AuthRequest,
  ): Promise<ConversationWithMessagesDto> {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const result = await this.messagingServices.getConversationWithMessages(
        conversationId,
        userId,
        query.limit,
      );

      return result as ConversationWithMessagesDto;
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('access')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message edited successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot edit this message',
  })
  async editMessage(
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.messageUseCases.editMessage({
        messageId,
        newContent: dto.newContent,
        editedBy: userId,
      });

      return { message: 'Message edited successfully' };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('edit') || _errMsg.includes('sender')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cannot delete this message',
  })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.messageUseCases.deleteMessage({
        messageId,
        deletedBy: userId,
      });

      return { message: 'Message deleted successfully' };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('delete') || _errMsg.includes('sender')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Post('messages/:messageId/reactions')
  @ApiOperation({ summary: 'Add reaction to message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reaction added successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async addReaction(
    @Param('messageId') messageId: string,
    @Body() dto: AddReactionDto,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.messageUseCases.addReaction({
        messageId,
        emoji: dto.emoji,
        userId,
      });

      return { message: 'Reaction added successfully' };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('access')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Delete('messages/:messageId/reactions/:emoji')
  @ApiOperation({ summary: 'Remove reaction from message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiParam({ name: 'emoji', description: 'Emoji to remove' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reaction removed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  async removeReaction(
    @Param('messageId') messageId: string,
    @Param('emoji') emoji: string,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.messageUseCases.removeReaction({
        messageId,
        emoji: decodeURIComponent(emoji),
        userId,
      });

      return { message: 'Reaction removed successfully' };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('access')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Post('messages/:messageId/read')
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message marked as read',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found',
  })
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.messageUseCases.markMessageAsRead({
        messageId,
        userId,
      });

      return { message: 'Message marked as read' };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('access')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Post('conversations/:conversationId/read-all')
  @ApiOperation({ summary: 'Mark all messages in conversation as read' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All messages marked as read',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  async markConversationAsRead(
    @Param('conversationId') conversationId: string,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      await this.messageUseCases.markConversationAsRead({
        conversationId,
        userId,
      });

      return { message: 'All messages marked as read' };
    } catch (error) {
      const _errMsg = getErrorMessage(error);
      if (_errMsg.includes('not found')) {
        throw new NotFoundException(_errMsg);
      }
      if (_errMsg.includes('access')) {
        throw new ForbiddenException(_errMsg);
      }
      throw new BadRequestException(_errMsg);
    }
  }

  @Get('conversations/:conversationId/unread-count')
  @ApiOperation({ summary: 'Get unread message count for conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
    schema: { type: 'object', properties: { count: { type: 'number' } } },
  })
  async getUnreadCount(
    @Param('conversationId') conversationId: string,
    @Request() req: AuthRequest,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new BadRequestException('User not authenticated');
      }

      const count = await this.messageUseCases.getUnreadMessageCount(
        conversationId,
        userId,
      );
      return { count };
    } catch (error) {
      throw new BadRequestException(getErrorMessage(error));
    }
  }
}
