import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseFilters,
  Request,
  HttpCode,
  HttpStatus,
  Res,
  Headers,
  Ip,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { GoogleAuthGuard } from '../../../shared/guards/google.guard';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import { Response } from 'express';
import { AuthExceptionFilter } from './filters/auth-exception.filter';
import {
  ClientType,
  isValidClientType,
} from '../domain/enums/client-type.enum';

// Application layer
import { AuthApplicationService } from '../application/auth-application.service';

// Application DTOs
import {
  RegisterUserDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../application/dto/auth-use-case.dto';

// Presentation DTOs
import {
  RegisterRequestDto,
  LoginRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  VerifyEmailRequestDto,
  ResendVerificationRequestDto,
} from './dto';

@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(
    private readonly authApplicationService: AuthApplicationService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterRequestDto) {
    try {
      // Map presentation DTO to application DTO
      const applicationDto: RegisterUserDto = {
        fullName: registerDto.fullName,
        email: registerDto.email,
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
      // Normalize clientType in case header is sent multiple times (joined with commas)
      const normalizedClientType = clientType.split(',')[0].trim();

      // Validate clientType
      if (
        normalizedClientType &&
        !isValidClientType(normalizedClientType.toLowerCase())
      ) {
        throw new BadRequestException(
          `Invalid clientType. Must be one of: ${Object.values(ClientType).join(', ')}`,
        );
      }

      console.log(
        `Login attempt: ${loginDto.identifier}, User-Agent: ${userAgent}, IP: ${clientIp}`,
      );

      const applicationDto: LoginDto = {
        identifier: loginDto.identifier,
        password: loginDto.password,
        rememberMe: loginDto.rememberMe || false,
        userAgent: userAgent || 'unknown',
        ipAddress: clientIp || 'unknown',
        deviceName: loginDto.deviceInfo?.deviceName,
        deviceType: loginDto.deviceInfo?.deviceType,
      };

      const result = await this.authApplicationService.login(applicationDto);

      const isWeb = normalizedClientType.toLowerCase() === 'web';
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
      const applicationDto: VerifyEmailRequestDto = {
        token: verifyDto.token,
        password: verifyDto.password,
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

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() resendDto: ResendVerificationRequestDto) {
    try {
      const result = await this.authApplicationService.resendVerification({
        email: resendDto.email,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordRequestDto) {
    try {
      const applicationDto: ForgotPasswordDto = {
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
      const applicationDto: ResetPasswordDto = {
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
      // Auto-detect: try body first, then cookie fallback
      const cookieRefresh = req.cookies?.['refresh_token'];
      const bodyRefresh = body?.refreshToken;
      const refreshToken = bodyRefresh || cookieRefresh;

      // Require refresh token for logout (strict validation)
      if (!refreshToken) {
        return {
          success: false,
          message: 'Logout failed',
        };
      }

      // Logout with valid token
      await this.authApplicationService.logout({ refreshToken });

      const isProd = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? ('none' as const) : ('lax' as const),
      };

      res.clearCookie('access_token', cookieOptions);
      res.clearCookie('refresh_token', cookieOptions);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed',
      };
    }
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Request() req, @Res({ passthrough: true }) res: Response) {
    try {
      // JWT strategy returns user with 'id' field
      const userId = req.user?.id || req.user?.sub;

      if (!userId) {
        throw new Error('User ID not found in request');
      }

      const result = await this.authApplicationService.logoutAll(userId);

      // Clear cookies for web clients
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      return {
        success: true,
        message: result.message,
        sessionsRevoked: result.sessionsRevoked,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() body: { refreshToken?: string },
    @Request() req,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-client-type') clientType: string = 'web',
  ) {
    try {
      // Auto-detect: try body first, then cookie fallback
      const refreshToken = body?.refreshToken || req.cookies?.['refresh_token'];

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      const tokens = await this.authApplicationService.refreshToken({
        refreshToken,
      });

      // Determine response strategy from x-client-type (only needed for WRITING tokens)
      const normalizedClientType = clientType
        .split(',')[0]
        .trim()
        .toLowerCase();
      const isWeb = normalizedClientType === 'web';

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

  // Google OAuth endpoints
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Request() req) {
    // This endpoint will redirect to Google OAuth
    // The actual redirect is handled by the GoogleAuthGuard
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      const result = req.user; // This comes from GoogleStrategy
      const isProd = process.env.NODE_ENV === 'production';

      // Google OAuth callback is always a browser redirect, so always set cookies
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

      return res.redirect(
        `${frontendUrl}/auth/success?message=login_successful`,
      );
    } catch (error) {
      console.error('Google auth callback error:', error);
      return res.redirect(
        `${frontendUrl}/auth/error?message=authentication_failed`,
      );
    }
  }
}
