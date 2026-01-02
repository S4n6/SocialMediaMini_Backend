import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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

// Presentation DTOs and Mappers
import {
  CreateUserRequestDto,
  UpdateProfileRequestDto,
  SearchUsersRequestDto,
  GetFollowersRequestDto,
  UserResponseDto,
  UserProfileResponseDto,
  UserListResponseDto,
  FollowersResponseDto,
  ApiSuccessResponseDto,
} from './dto';
import { PresentationMapper } from './mappers/presentation.mapper';

// Guards and decorators
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { SkipGuards } from '../../../shared/decorators/skipGuard.decorator';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import { Roles } from '../../../shared/decorators/roles.decorator';
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
    type: ApiSuccessResponseDto,
  })
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserRequestDto,
  ): Promise<ApiSuccessResponseDto<UserResponseDto>> {
    // Convert presentation DTO to application command
    const appCommand = PresentationMapper.toCreateUserCommand(createUserDto);

    // Execute use case
    const appResult = await this.userApplicationService.createUser(appCommand);

    // Convert application result to presentation DTO
    const result = PresentationMapper.toUserResponseDto(appResult);

    return PresentationMapper.toApiSuccessResponse(
      result,
      'User created successfully',
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by query' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @SwaggerResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async searchUsers(
    @Query('q') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ): Promise<ApiSuccessResponseDto<UserListResponseDto>> {
    // Create request DTO
    const requestDto = new SearchUsersRequestDto();
    requestDto.query = query;
    requestDto.page = page;
    requestDto.limit = limit;

    // Convert to application query
    const appQuery = PresentationMapper.toSearchUsersQuery(requestDto);

    // Execute use case
    const appResult = await this.userApplicationService.searchUsers(appQuery);

    // Convert application result to presentation DTO
    const result = PresentationMapper.toUserListResponseDto(appResult);

    return PresentationMapper.toApiSuccessResponse(
      result,
      'Users retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @SwaggerResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponseDto<UserResponseDto | UserProfileResponseDto>> {
    // Execute use case
    const appResult = await this.userApplicationService.getUserProfile(id);

    // Convert application result to presentation DTO
    let result;
    if ('role' in appResult) {
      // It's a UserProfileResponseDto (owner view)
      result = PresentationMapper.toUserProfileResponseDto(appResult);
    } else {
      // It's a UserResponseDto (public view)
      result = PresentationMapper.toUserResponseDto(appResult);
    }

    return PresentationMapper.toApiSuccessResponse(
      result,
      'User retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @SwaggerResponse({
    status: 200,
    description: 'User updated successfully',
    type: ApiSuccessResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileRequestDto,
  ): Promise<ApiSuccessResponseDto<UserResponseDto>> {
    // Convert presentation DTO to application command
    const appCommand =
      PresentationMapper.toUpdateProfileCommand(updateProfileDto);

    // Execute use case
    const appResult = await this.userApplicationService.updateProfile(
      id,
      appCommand,
    );

    // Convert application result to presentation DTO
    const result = PresentationMapper.toUserResponseDto(appResult);

    return PresentationMapper.toApiSuccessResponse(
      result,
      'Profile updated successfully',
    );
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID to follow' })
  @SwaggerResponse({
    status: 200,
    description: 'User followed successfully',
    type: ApiSuccessResponseDto,
  })
  async followUser(
    @Param('id', ParseUUIDPipe) targetUserId: string,
  ): Promise<ApiSuccessResponseDto<null>> {
    // Note: In real implementation, follower ID would come from JWT token
    const followerId = 'current-user-id'; // This should come from auth context

    // Execute use case
    const command = PresentationMapper.toFollowUserCommand(
      followerId,
      targetUserId,
    );
    await this.userApplicationService.followUser(command);

    return new ApiSuccessResponseDto(null, 'User followed successfully');
  }

  @Post(':id/unfollow')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID to unfollow' })
  @SwaggerResponse({
    status: 200,
    description: 'User unfollowed successfully',
    type: ApiSuccessResponseDto,
  })
  async unfollowUser(
    @Param('id', ParseUUIDPipe) targetUserId: string,
  ): Promise<ApiSuccessResponseDto<null>> {
    // Note: In real implementation, follower ID would come from JWT token
    const followerId = 'current-user-id'; // This should come from auth context

    // Execute use case
    const command = PresentationMapper.toUnfollowUserCommand(
      followerId,
      targetUserId,
    );
    await this.userApplicationService.unfollowUser(command);

    return new ApiSuccessResponseDto(null, 'User unfollowed successfully');
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @SwaggerResponse({
    status: 200,
    description: 'Followers retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async getFollowers(
    @Param('id', ParseUUIDPipe) userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ): Promise<ApiSuccessResponseDto<FollowersResponseDto>> {
    // Create request DTO
    const requestDto = new GetFollowersRequestDto();
    requestDto.page = page;
    requestDto.limit = limit;

    // Convert to application query
    const appQuery = PresentationMapper.toGetFollowersQuery(requestDto, userId);

    // Execute use case
    const appResult =
      await this.userApplicationService.getUserFollowers(appQuery);

    // Convert application result to presentation DTO
    const result = PresentationMapper.toFollowersResponseDto(appResult);

    return PresentationMapper.toApiSuccessResponse(
      result,
      'Followers retrieved successfully',
    );
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users that this user is following' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @SwaggerResponse({
    status: 200,
    description: 'Following list retrieved successfully',
    type: ApiSuccessResponseDto,
  })
  async getFollowing(
    @Param('id', ParseUUIDPipe) userId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ): Promise<ApiSuccessResponseDto<FollowersResponseDto>> {
    // Create request DTO
    const requestDto = new GetFollowersRequestDto();
    requestDto.page = page;
    requestDto.limit = limit;

    // Convert to application query
    const appQuery = PresentationMapper.toGetFollowersQuery(requestDto, userId);

    // Execute use case
    const appResult =
      await this.userApplicationService.getUserFollowing(appQuery);

    // Convert application result to presentation DTO
    const result = PresentationMapper.toFollowersResponseDto(appResult);

    return PresentationMapper.toApiSuccessResponse(
      result,
      'Following list retrieved successfully',
    );
  }

  @Post(':id/verify-email')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @SwaggerResponse({
    status: 200,
    description: 'Email verified successfully',
    type: ApiSuccessResponseDto,
  })
  async verifyEmail(
    @Param('id', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponseDto<null>> {
    // Execute use case
    const command = PresentationMapper.toVerifyEmailCommand(userId);
    await this.userApplicationService.verifyEmail(command);

    return new ApiSuccessResponseDto(null, 'Email verified successfully');
  }
}
