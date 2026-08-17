import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Controller('test')
export class TestController {
  constructor(private readonly prisma: PrismaService) { }

  @Get()
  getTest() {
    return {
      status: 'OK',
      message: 'Test endpoint is working',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'OK',
      health: 'Service is healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('read-users')
  async readUsers() {
    try {
      const users = await this.prisma.user.findMany();
      return {
        status: 'SUCCESS',
        message: 'Successfully read users from the database',
        data: users,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: 'ERROR',
          message: 'Failed to read from database',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('write-user')
  async createTestUser(
    @Body() body: { fullName?: string; email?: string; username?: string },
  ) {
    try {
      const email = body.email || `test-${Date.now()}@example.com`;
      const username = body.username || `testuser_${Date.now()}`;
      const fullName = body.fullName || 'Test User AWS';

      const newUser = await this.prisma.user.create({
        data: {
          fullName,
          email,
          username,
          isEmailVerified: true,
        },
      });

      return {
        status: 'SUCCESS',
        message: 'Successfully wrote user to the database',
        data: newUser,
      };
    } catch (error) {
      console.error('👉 LỖI GỐC TỪ PRISMA:', error);
      throw new HttpException(
        {
          status: 'ERROR',
          message: 'Failed to write to database',
          error: error.message || error,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

