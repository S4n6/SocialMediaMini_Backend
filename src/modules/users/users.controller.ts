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
import { UsersService } from './users.service';
import { RolesGuard } from '../../guards/roles.guard';
import { SkipGuards } from '../../decorators/skipGuard.decorator';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { Roles } from '../../decorators/roles.decorator';
import { UserResponse } from './dto/responseUser.dto';
import { UserListItem } from './dto/responseUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { CreateUserDto } from './dto/createUser.dto';
import { ROLES } from 'src/constants/roles.constant';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @SkipGuards()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<ApiResponse<UserResponse>> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(ROLES.ADMIN)
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<ApiResponse<UserResponse[]>> {
    return this.usersService.findAll(page, limit);
  }

  @Get('search')
  async searchUsers(
    @Query('q') query: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ): Promise<ApiResponse<UserListItem[]>> {
    return this.usersService.searchUsers(query, page, limit);
  }

  @Get('username/:username')
  async findByUsername(
    @Param('username') username: string,
  ): Promise<ApiResponse<UserResponse> | null> {
    return this.usersService.findByUsername(username);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<UserResponse>> {
    console.log('Finding user with ID:', id);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<UserResponse>> {
    console.log('Update User DTO:', updateUserDto);
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    return this.usersService.remove(id);
  }
}
