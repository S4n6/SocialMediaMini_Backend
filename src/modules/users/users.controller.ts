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
  ParseUUIDPipe
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponse } from './users.interfaces';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto
  ): Promise<UserResponse> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<UserResponse[]> {
    return this.usersService.findAll();
  }

  @Get('search')
  async searchUsers(@Query('q') query: string): Promise<UserResponse[]> {
    return this.usersService.searchUsers(query);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<UserResponse> {
    return this.usersService.findOne(id);
  }

  @Get(':id/friends')
  async getUserFriends(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<UserResponse[]> {
    return this.usersService.getUserFriends(id);
  }

  @Get('username/:username')
  async findByUsername(
    @Param('username') username: string
  ): Promise<UserResponse | null> {
    return this.usersService.findByUsername(username);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto
  ): Promise<UserResponse> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }

  @Post(':id/friends/:friendId')
  @HttpCode(HttpStatus.CREATED)
  async addFriend(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('friendId', ParseUUIDPipe) friendId: string
  ): Promise<{ message: string }> {
    return this.usersService.addFriend(userId, friendId);
  }

  @Delete(':id/friends/:friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFriend(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('friendId', ParseUUIDPipe) friendId: string
  ): Promise<{ message: string }> {
    return this.usersService.removeFriend(userId, friendId);
  }
}
