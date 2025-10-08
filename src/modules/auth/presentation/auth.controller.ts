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
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleAuthGuard } from '../../../shared/guards/google.guard';
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
import { RegisterUserDto } from '../application';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('LEGACY_AUTH_APPLICATION_SERVICE')
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
      console.log(
        `Login attempt: ${loginDto.identifier}, User-Agent: ${userAgent}, IP: ${clientIp}`,
      );

      const applicationDto: any = {
        identifier: loginDto.identifier,
        password: loginDto.password,
        rememberMe: loginDto.rememberMe || false,
        userAgent: userAgent || 'unknown',
        ipAddress: clientIp || 'unknown',
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

      // Prefer cookie for web clients, fallback to body.refreshToken.
      const cookieRefresh = req.cookies
        ? req.cookies['refresh_token']
        : undefined;
      const refreshToken = isWeb
        ? cookieRefresh || body.refreshToken
        : body.refreshToken || cookieRefresh;

      // Call logout once if we have a refresh token
      if (refreshToken) {
        await this.authApplicationService.logout({ refreshToken });
      }

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
      const clientType = req.headers['x-client-type'].toString();
      const isWeb = clientType.toLowerCase() === 'web';

      const refreshToken = isWeb
        ? req.cookies['refresh_token']
        : body.refreshToken;

      console.log('Refresh token received:', refreshToken);

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
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
    @Headers('x-client-type') clientType: string = 'web',
  ) {
    try {
      const result = req.user; // This comes from GoogleStrategy
      const isWeb = clientType.toLowerCase() === 'web';

      if (isWeb) {
        const isProd = process.env.NODE_ENV === 'production';

        // Set tokens as cookies for web clients
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

        // Redirect to frontend with success
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(
          `${frontendUrl}/auth/success?message=Login successful`,
        );
      }

      // For mobile/API clients, return JSON
      return {
        success: true,
        message: result.message || 'Google authentication successful',
        user: result.user,
        tokens: result.tokens,
        session: result.session,
      };
    } catch (error) {
      console.error('Google auth callback error:', error);

      const isWeb = clientType.toLowerCase() === 'web';
      if (isWeb) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(
          `${frontendUrl}/auth/error?message=Authentication failed`,
        );
      }

      throw error;
    }
  }
}
