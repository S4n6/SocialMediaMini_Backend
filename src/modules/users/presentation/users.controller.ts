import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

// Clean Architecture imports
import { UserApplicationService } from '../application/user-application.service';
import {
  CreateUserDto,
  UpdateProfileDto,
  UserResponseDto,
  UserListItemDto,
  SearchUsersDto,
  GetFollowersDto,
} from '../application/dto/user.dto';

// Guards and decorators (using correct paths)
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { SkipGuards } from '../../../shared/decorators/skipGuard.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../../shared/decorators/currentUser.decorator';
import { ROLES } from '../../../shared/constants/roles.constant';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly userApplicationService: UserApplicationService,
  ) {}

  @Post()
  @SkipGuards()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @SwaggerResponse({
    status: 201,
    description: 'User created successfully',
  })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.userApplicationService.createUser(createUserDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by query' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @SwaggerResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  async searchUsers(
    @Query('q') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    // @CurrentUser('id') requesterId?: string, // Uncomment when auth is ready
  ): Promise<{
    users: UserListItemDto[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }> {
    const searchDto: SearchUsersDto = { query, page, limit };
    return this.userApplicationService.searchUsers(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @SwaggerResponse({
    status: 200,
    description: 'User retrieved successfully',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.userApplicationService.getUserProfile(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @SwaggerResponse({
    status: 200,
    description: 'User updated successfully',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.userApplicationService.updateProfile(id, updateProfileDto);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @SwaggerResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    // This would need to be implemented in UserApplicationService
    throw new Error(
      'Delete user functionality not yet implemented in Clean Architecture',
    );
  }

  @Post(':userId/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID to follow' })
  @SwaggerResponse({
    status: 200,
    description: 'User followed successfully',
  })
  async followUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    // @CurrentUser('id') currentUserId: string, // Uncomment when auth is ready
  ): Promise<{ message: string }> {
    // For now, we'll use a placeholder until auth is properly integrated
    const currentUserId = 'placeholder-user-id';
    await this.userApplicationService.followUser(currentUserId, userId);
    return { message: 'User followed successfully' };
  }

  @Delete(':userId/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User ID to unfollow',
  })
  @SwaggerResponse({
    status: 200,
    description: 'User unfollowed successfully',
  })
  async unfollowUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    // @CurrentUser('id') currentUserId: string, // Uncomment when auth is ready
  ): Promise<{ message: string }> {
    // For now, we'll use a placeholder until auth is properly integrated
    const currentUserId = 'placeholder-user-id';
    await this.userApplicationService.unfollowUser(currentUserId, userId);
    return { message: 'User unfollowed successfully' };
  }

  @Get(':userId/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @SwaggerResponse({
    status: 200,
    description: 'Followers retrieved successfully',
  })
  async getFollowers(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ): Promise<{
    followers: UserListItemDto[];
    total: number;
    hasMore: boolean;
  }> {
    const dto: GetFollowersDto = { page, limit };
    return this.userApplicationService.getUserFollowers(userId, dto);
  }

  @Get(':userId/following')
  @ApiOperation({ summary: 'Get users followed by user' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @SwaggerResponse({
    status: 200,
    description: 'Following list retrieved successfully',
  })
  async getFollowing(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ): Promise<{
    following: UserListItemDto[];
    total: number;
    hasMore: boolean;
  }> {
    const dto: GetFollowersDto = { page, limit };
    return this.userApplicationService.getUserFollowing(userId, dto);
  }
}
