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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { SkipGuards } from 'src/decorators/skipGuard.decorator';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/constants/roles.constant';
import { UserResponse } from './dto/responseUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { CreateUserDto } from './dto/createUser.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @SkipGuards()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<UserResponse> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(): Promise<UserResponse[]> {
    return this.usersService.findAll();
  }

  @Get('search')
  async searchUsers(@Query('q') query: string): Promise<UserResponse[]> {
    return this.usersService.searchUsers(query);
  }

  @Get('username/:username')
  async findByUsername(
    @Param('username') username: string,
  ): Promise<UserResponse | null> {
    return this.usersService.findByUsername(username);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponse> {
    console.log('Finding user with ID:', id);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<UserResponse> {
    console.log('Update User DTO:', updateUserDto);
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }
}
