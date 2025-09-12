import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
  Res,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from 'src/guards/jwt.guard';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { ResendVerificationDto } from './dto/verifyEmail.dto';
import { GoogleAuthGuard } from 'src/guards/google.guard';
import { GoogleLoginDto } from './dto/google-auth.dto';
import { Response } from 'express';
import { URLS } from 'src/constants/urls.constant';
import { JWT } from 'src/config/jwt.config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  async verifyEmailByParam(@Param('token') token: string) {
    const result = await this.authService.verifyEmail(token);
    return {
      success: true,
      message: 'Email verified successfully',
      data: result,
    };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(@Body() resendDto: ResendVerificationDto) {
    const result = await this.authService.resendVerificationEmail(
      resendDto.email,
    );
    return {
      success: true,
      message: 'Verification email sent successfully',
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: 'Logged out successfully' };
  }

  // ===== GOOGLE AUTHENTICATION ENDPOINTS =====

  // For WEB: Redirect to Google OAuth
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  // For WEB: Google OAuth callback
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    try {
      const user = req.user;

      // Set cookies for tokens (HttpOnly). Do not expose tokens via query string.
      const isProd = process.env.NODE_ENV === 'production';

      // Determine cookie options
      const accessMaxAge = parseExpiryToMs(JWT.EXPIRES_IN);
      const refreshMaxAge = parseExpiryToMs(JWT.REFRESH_EXPIRES_IN);

      // Access token cookie
      if (user.accessToken) {
        res.cookie('access_token', user.accessToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? 'none' : 'lax',
          maxAge: accessMaxAge,
        });
      }

      // Refresh token cookie (if provided)
      if (user.refreshToken) {
        res.cookie('refresh_token', user.refreshToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? 'none' : 'lax',
          maxAge: refreshMaxAge,
        });
      }

      // Return HTML with postMessage script for popup auth flow
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      };

      res.send(`
        <script>
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            payload: { user: ${JSON.stringify(userData)} }
          }, '${URLS.FRONT_END_WEB}');
          window.close();
        </script>
      `);
    } catch (error) {
      res.send(`
        <script>
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: '${error.message}'
          }, '${URLS.FRONT_END_WEB}');
          window.close();
        </script>
      `);
    }
  }

  // For MOBILE: Verify Google ID Token
  @Post('google/mobile')
  @HttpCode(HttpStatus.OK)
  async googleMobileAuth(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.verifyGoogleToken(googleLoginDto.idToken);
  }
}

// Helper: convert expiry like '24h' or '7d' or seconds string to milliseconds for cookie maxAge
function parseExpiryToMs(expiry: string | undefined): number {
  if (!expiry) return 0;
  const s = expiry.trim().toLowerCase();
  const num = parseInt(s, 10);
  if (s.endsWith('ms')) return num;
  if (s.endsWith('s')) return num * 1000;
  if (s.endsWith('m')) return num * 60 * 1000;
  if (s.endsWith('h')) return num * 60 * 60 * 1000;
  if (s.endsWith('d')) return num * 24 * 60 * 60 * 1000;
  // Fallback: if it's a number string, assume seconds
  if (!isNaN(num)) return num * 1000;
  return 0;
}
