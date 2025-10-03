import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  Headers,
  Ip,
} from '@nestjs/common';
import { Response } from 'express';

// Application layer
import { AuthApplicationService } from '../application/auth-application.service';

// Presentation DTOs
import {
  RegisterRequestDto,
  LoginRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
  ResendVerificationRequestDto,
} from './dto/auth-request.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authApplicationService: AuthApplicationService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterRequestDto) {
    try {
      // Map presentation DTO to application DTO
      const applicationDto: any = {
        fullName: registerDto.fullName,
        email: registerDto.email,
        password: registerDto.password,
        dateOfBirth: registerDto.dateOfBirth,
        username: registerDto.username || `user_${Date.now()}`,
        phoneNumber: registerDto.phoneNumber,
        gender: registerDto.gender,
        avatar: registerDto.avatar,
      };

      const result =
        await this.authApplicationService.registerUser(applicationDto);

      return {
        success: true,
        message:
          'Registration successful. Please check your email for verification.',
        user: {
          id: result.user.id,
          email: result.user.email,
          fullName: result.user.fullName,
          username: result.user.username,
          role: result.user.role,
          isEmailVerified: result.user.isEmailVerified,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-client-type') clientType: string = 'web',
    @Ip() clientIp?: string,
  ) {
    try {
      console.log(
        `Login attempt: ${loginDto.identifier}, User-Agent: ${userAgent}, IP: ${clientIp}`,
      );

      const applicationDto: any = {
        identifier: loginDto.identifier,
        password: loginDto.password,
        rememberMe: loginDto.rememberMe || false,
      };

      const result = await this.authApplicationService.login(applicationDto);

      const isWeb = clientType.toLowerCase() === 'web';
      const isProd = process.env.NODE_ENV === 'production';

      if (isWeb) {
        // Set HTTP-only cookies
        if (result.tokens?.accessToken) {
          res.cookie('access_token', result.tokens.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
          });
        }

        if (result.tokens?.refreshToken) {
          res.cookie('refresh_token', result.tokens.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
        }

        return {
          success: true,
          message: 'Login successful',
          user: result.user,
        };
      }

      // Mobile clients - return tokens in body
      return {
        success: true,
        message: 'Login successful',
        user: result.user,
        tokens: {
          accessToken: result.tokens?.accessToken,
          refreshToken: result.tokens?.refreshToken,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyDto: VerifyEmailRequestDto) {
    try {
      const applicationDto: any = {
        token: verifyDto.token,
      };

      const result =
        await this.authApplicationService.verifyEmail(applicationDto);

      return {
        success: true,
        message: 'Email verified successfully',
        user: result,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordRequestDto) {
    try {
      const applicationDto: any = {
        email: forgotPasswordDto.email,
      };

      await this.authApplicationService.forgotPassword(applicationDto);

      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordRequestDto) {
    try {
      const applicationDto: any = {
        token: resetPasswordDto.token,
        newPassword: resetPasswordDto.newPassword,
      };

      await this.authApplicationService.resetPassword(applicationDto);

      return {
        success: true,
        message: 'Password has been reset successfully.',
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: { refreshToken?: string },
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const clientType = (req.headers['x-client-type'] || '').toString();
      const isWeb = clientType.toLowerCase() === 'web';

      if (isWeb) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
      }

      if (body.refreshToken) {
        const applicationDto: any = {
          userId: 'temp_user_id', // TODO: Get from JWT
          refreshToken: body.refreshToken,
        };
        await this.authApplicationService.logout(applicationDto);
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() body: { refreshToken?: string },
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const clientType = (req.headers['x-client-type'] || '').toString();
      const isWeb = clientType.toLowerCase() === 'web';

      const refreshToken = isWeb
        ? req.cookies['refresh_token']
        : body.refreshToken;

      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      const applicationDto: any = {
        refreshToken,
      };

      const tokens =
        await this.authApplicationService.refreshToken(applicationDto);

      if (isWeb) {
        const isProd = process.env.NODE_ENV === 'production';

        if (tokens.accessToken) {
          res.cookie('access_token', tokens.accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
          });
        }

        if (tokens.refreshToken) {
          res.cookie('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
        }

        return {
          success: true,
          message: 'Token refreshed',
        };
      }

      return {
        success: true,
        message: 'Token refreshed',
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
