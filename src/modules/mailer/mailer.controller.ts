import {
  Controller,
  Get,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MailerService } from './mailer.service';
import {
  SendEmailDto,
  SendWelcomeEmailDto,
  SendPasswordResetDto,
  SendFriendRequestDto,
} from './dto/sendMail.dto';
import { CreateMailerDto } from './dto/createMailer.dto';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendEmail(@Body(ValidationPipe) createMailerDto: CreateMailerDto) {
    const result = await this.mailerService.sendEmail(createMailerDto);
    return {
      message: 'Email sent successfully',
      data: result,
    };
  }

  @Post('send-simple')
  @HttpCode(HttpStatus.OK)
  async sendSimpleEmail(@Body(ValidationPipe) sendEmailDto: SendEmailDto) {
    const result = await this.mailerService.sendSimpleEmail(sendEmailDto);
    return {
      message: 'Simple email sent successfully',
      data: result,
    };
  }

  @Post('welcome')
  @HttpCode(HttpStatus.OK)
  async sendWelcomeEmail(
    @Body(ValidationPipe) welcomeEmailDto: SendWelcomeEmailDto,
  ) {
    const result = await this.mailerService.sendWelcomeEmail(welcomeEmailDto);
    return {
      message: 'Welcome email sent successfully',
      data: result,
    };
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  async sendPasswordResetEmail(
    @Body(ValidationPipe) passwordResetDto: SendPasswordResetDto,
  ) {
    const result =
      await this.mailerService.sendPasswordResetEmail(passwordResetDto);
    return {
      message: 'Password reset email sent successfully',
      data: result,
    };
  }

  @Post('friend-request')
  @HttpCode(HttpStatus.OK)
  async sendFriendRequestEmail(
    @Body(ValidationPipe) friendRequestDto: SendFriendRequestDto,
  ) {
    const result =
      await this.mailerService.sendFriendRequestEmail(friendRequestDto);
    return {
      message: 'Friend request email sent successfully',
      data: result,
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async sendEmailVerification(
    @Body(ValidationPipe)
    verificationDto: {
      email: string;
      username: string;
      verificationToken: string;
    },
  ) {
    const result = await this.mailerService.sendEmailVerification(
      verificationDto.email,
      verificationDto.username,
      verificationDto.verificationToken,
    );
    return {
      message: 'Email verification sent successfully',
      data: result,
    };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  async sendBulkEmails(@Body(ValidationPipe) bulkEmailDto: CreateMailerDto[]) {
    const results = await this.mailerService.sendBulkEmails(bulkEmailDto);

    const summary = {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      details: results,
    };

    return {
      message: 'Bulk email sending completed',
      data: summary,
    };
  }

  @Get('test-connection')
  async testConnection() {
    const result = await this.mailerService.testConnection();
    return {
      message: 'Email connection test completed',
      data: result,
    };
  }

  @Get('status')
  async getStatus() {
    const connectionTest = await this.mailerService.testConnection();
    return {
      message: 'Email service status',
      data: {
        service: 'Mailer Service',
        status: connectionTest.success ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        connectionTest,
      },
    };
  }
}
