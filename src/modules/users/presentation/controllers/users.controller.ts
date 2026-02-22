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
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Request,
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
import { UserApplicationService } from '../../application/user-application.service';

// Domain exceptions
import {
  DomainException,
  ValidationException,
} from '../../domain/exceptions/domain.exceptions';
import {
  EntityAlreadyExistsException,
  BusinessRuleException,
  UserNotFoundException,
  ProfileUpdateTooFrequentException,
} from '../../domain/exceptions/user.exceptions';

// Presentation DTOs and Mappers
import {
  CreateUserRequestDto,
  UpdateProfileRequestDto,
  SearchUsersRequestDto,
  UserResponseDto,
  UserProfileResponseDto,
  UserListResponseDto,
  ApiSuccessResponseDto,
} from '../dto';
import { PresentationMapper } from '../mappers/presentation.mapper';

// Guards and decorators
import { SkipGuards } from '../../../../shared/decorators/skipGuard.decorator';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { ROLES } from '../../../../shared/constants/roles.constant';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
    try {
      // Convert presentation DTO to application command
      const appCommand = PresentationMapper.toCreateUserCommand(createUserDto);

      // Execute use case
      const appResult =
        await this.userApplicationService.createUser(appCommand);

      // Convert application result to presentation DTO
      const result = PresentationMapper.toUserResponseDto(appResult);

      return PresentationMapper.toApiSuccessResponse(
        result,
        'User created successfully',
      );
    } catch (error) {
      // Convert domain exceptions to HTTP exceptions
      if (
        error instanceof EntityAlreadyExistsException ||
        error instanceof ValidationException ||
        error instanceof BusinessRuleException
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
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
    @Request() req,
  ): Promise<ApiSuccessResponseDto<UserListResponseDto>> {
    // Create request DTO
    const requestDto = new SearchUsersRequestDto();
    requestDto.query = query;
    requestDto.page = page;
    requestDto.limit = limit;

    // Convert to application query, pass requesterId for isFollowing context
    const appQuery = PresentationMapper.toSearchUsersQuery(
      requestDto,
      req.user?.id,
    );

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
    @Request() req,
  ): Promise<ApiSuccessResponseDto<UserResponseDto | UserProfileResponseDto>> {
    // Execute use case — pass requesterId so own profile returns full data
    const appResult = await this.userApplicationService.getUserProfile(
      id,
      req.user?.id,
    );

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
    @Request() req,
  ): Promise<ApiSuccessResponseDto<UserResponseDto>> {
    try {
      // Ownership check: users can only update their own profile
      if (req.user?.id !== id) {
        throw new ForbiddenException('You can only update your own profile');
      }

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
    } catch (error) {
      // Convert domain exceptions to HTTP exceptions
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof ProfileUpdateTooFrequentException ||
        error instanceof BusinessRuleException ||
        error instanceof ValidationException
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post(':id/verify-email')
  @Roles(ROLES.ADMIN, ROLES.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email (admin only)' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @SwaggerResponse({
    status: 200,
    description: 'Email verified successfully',
    type: ApiSuccessResponseDto,
  })
  async verifyEmail(
    @Param('id', ParseUUIDPipe) userId: string,
    @Request() req,
  ): Promise<ApiSuccessResponseDto<null>> {
    // Only admins can manually verify emails (normal flow is via token in auth module)
    const userRole = req.user?.role?.toLowerCase();
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      throw new ForbiddenException(
        'Only administrators can manually verify user emails',
      );
    }

    const command = PresentationMapper.toVerifyEmailCommand(userId);
    await this.userApplicationService.verifyEmail(command);

    return new ApiSuccessResponseDto(null, 'Email verified successfully');
  }
}
