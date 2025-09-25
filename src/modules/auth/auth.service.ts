import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateUserDto } from '../users/dto/createUser.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { mailQueue } from 'src/queues/mail.queue';
import { NotificationGateway } from '../notification/notification.gateway';
import { GoogleUserDto } from './dto/google-auth.dto';
import { OAuth2Client } from 'google-auth-library';
import { ROLES } from 'src/constants/roles.constant';
import { JWT } from 'src/config/jwt.config';
import { RedisCacheService } from '../cache/cache.service';
import { TIME_EXPIRE } from 'src/constants/time-expire.constant';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private notificationGateway: NotificationGateway,
    private cacheService: RedisCacheService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  // ===== SESSION HELPERS =====

  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateRefreshToken(sessionId: string): string {
    // Include session ID in refresh token payload
    const payload = { sessionId, timestamp: Date.now() };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  private async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const sessionId = this.generateSessionId();

    // Calculate expiry date from JWT config
    const expiresAt = new Date();
    const expiryTime = JWT.REFRESH_EXPIRES_IN;

    if (expiryTime.endsWith('d')) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryTime));
    } else if (expiryTime.endsWith('h')) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiryTime));
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await this.prisma.session.create({
      data: {
        sessionId,
        userId,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return this.generateRefreshToken(sessionId);
  }

  private async createTokensForUser(
    userId: string,
    email: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createSession(userId, userAgent, ipAddress);

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ userId: string; email: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // Decode the refresh token to get session ID
      const tokenPayload = JSON.parse(
        Buffer.from(refreshToken, 'base64').toString(),
      );
      const { sessionId } = tokenPayload;

      if (!sessionId) {
        throw new UnauthorizedException('Invalid refresh token format');
      }

      // Find the session in database
      const session = await this.prisma.session.findUnique({
        where: {
          sessionId,
        },
        include: { user: true },
      });

      if (!session) {
        throw new UnauthorizedException(
          'Session not found. Please log in again.',
        );
      }

      // Check if session is revoked
      if (session.isRevoked) {
        throw new UnauthorizedException(
          'Session has been revoked. Please log in again.',
        );
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        // Clean up expired session
        await this.prisma.session.update({
          where: { id: session.id },
          data: { isRevoked: true },
        });
        throw new UnauthorizedException(
          'Session has expired. Please log in again.',
        );
      }

      // Update last used timestamp
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });

      // Check for suspicious activity
      await this.detectSuspiciousActivity(session.userId);

      return {
        userId: session.userId,
        email: session.user.email,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Invalid refresh token. Please log in again.',
      );
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      // Decode the refresh token to get session ID
      const tokenPayload = JSON.parse(
        Buffer.from(refreshToken, 'base64').toString(),
      );
      const { sessionId } = tokenPayload;

      if (sessionId) {
        await this.prisma.session.updateMany({
          where: {
            sessionId,
            isRevoked: false,
          },
          data: { isRevoked: true },
        });
      }
    } catch (error) {
      // Silently ignore invalid refresh tokens
      console.warn('Failed to revoke refresh token:', error.message);
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  // Cleanup expired and revoked sessions
  async cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Expired sessions
          { isRevoked: true }, // Revoked sessions
        ],
      },
    });

    return { deletedCount: result.count };
  }

  // Security: Detect and revoke suspicious session usage
  async detectSuspiciousActivity(
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    const recentSessions = await this.prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
    });

    // If too many active sessions, might be suspicious
    if (recentSessions.length > 10) {
      await this.revokeAllUserSessions(userId);
      // TODO: Send security alert email
      console.warn(
        `Suspicious activity detected for user ${userId}. All sessions revoked.`,
      );
    }
  }

  // ===== AUTH METHODS =====

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: registerDto.email },
          ...(registerDto.userName ? [{ userName: registerDto.userName }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        // If the email exists but is not verified, instruct user to verify
        if (!existingUser.isEmailVerified) {
          throw new BadRequestException(
            'Email already registered but not verified. Please verify your email or request a new verification email.',
          );
        }
        throw new ConflictException('Email already registered');
      }
      if (
        registerDto.userName &&
        existingUser.userName === registerDto.userName
      ) {
        throw new ConflictException('Username already taken');
      }
    }

    // Generate email verification token with shorter expiry
    const verificationToken = this.jwtService.sign(
      { sub: registerDto.userName, email: registerDto.email },
      { expiresIn: '30m' },
    );

    // Store token in Redis with 30 minutes TTL
    const tokenKey = `email_verification:${registerDto.email}`;
    await this.cacheService.set(
      tokenKey,
      {
        token: verificationToken,
        isValid: true,
      },
      TIME_EXPIRE.EMAIL_VERIFICATION,
    );

    // Compose fullName and userName
    const fullName = registerDto.fullName?.trim();

    // Create user WITHOUT password (will be set during email verification)
    const user = await this.prisma.user.create({
      data: {
        fullName,
        userName: registerDto.userName as string,
        email: registerDto.email,
        password: null, // No password initially
        dateOfBirth: registerDto.dateOfBirth,
        phoneNumber: registerDto.phoneNumber,
        avatar: registerDto.avatar,
        bio: registerDto.bio,
        location: registerDto.location,
        role: ROLES.USER,
      },
      select: {
        id: true,
        userName: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        dateOfBirth: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send verification email
    await this.mailerService.sendEmailVerification(
      user.email,
      user.userName,
      verificationToken,
    );

    return {
      message:
        'User registered successfully. Please check your email to verify your account and set your password.',
      user,
      requiresEmailVerification: true,
      requiresPasswordSet: true,
    };
  }

  async verifyEmail(token: string, password?: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    // Verify JWT token first to extract email
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const email = payload.email;
    if (!email) {
      throw new BadRequestException('Invalid token payload');
    }

    // Check token stored in Redis under the user's email and ensure it matches
    const emailKey = `email_verification:${email}`;
    const stored = await this.cacheService.get<{
      token: string;
      isValid: boolean;
    }>(emailKey);

    if (!stored || !stored.isValid || stored.token !== token) {
      throw new BadRequestException(
        'Token has expired or does not match the latest verification token. Please request a new verification email.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      // Remove token from Redis since it's already verified
      await this.cacheService.del(emailKey);

      // If user already verified but doesn't have password (edge case)
      if (!user.password && password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const updatedUser = await this.prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
          select: {
            id: true,
            userName: true,
            email: true,
            fullName: true,
            isEmailVerified: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        });

        const { accessToken, refreshToken } = await this.createTokensForUser(
          updatedUser.id,
          updatedUser.email,
        );

        return {
          message: 'Password set successfully. You are now logged in.',
          user: updatedUser,
          accessToken,
          refreshToken,
        };
      }

      return {
        message: 'Email is already verified',
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: true,
        },
      };
    }

    // For new users (password is null)
    if (user.password === null) {
      if (!password) {
        throw new BadRequestException(
          'Password is required for new users to complete email verification',
        );
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user: verify email and set password
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          password: hashedPassword,
        },
        select: {
          id: true,
          userName: true,
          email: true,
          fullName: true,
          isEmailVerified: true,
          emailVerifiedAt: true,
          createdAt: true,
        },
      });

      // Remove token from Redis after successful verification
      await this.cacheService.del(emailKey);

      // Create tokens for immediate login
      const { accessToken, refreshToken } = await this.createTokensForUser(
        updatedUser.id,
        updatedUser.email,
      );

      return {
        message:
          'Email verified and password set successfully. You are now logged in.',
        user: updatedUser,
        accessToken,
        refreshToken,
      };
    }

    // For users who already have password (e.g., from Google auth)
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifiedAt: new Date() },
      select: {
        id: true,
        userName: true,
        email: true,
        fullName: true,
        isEmailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    // Remove token from Redis after successful verification
    await this.cacheService.del(emailKey);

    const { accessToken, refreshToken } = await this.createTokensForUser(
      updatedUser.id,
      updatedUser.email,
    );

    return {
      message: 'Email verified successfully. You are now logged in.',
      user: updatedUser,
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: loginDto.email },
          ...(loginDto.userName ? [{ userName: loginDto.userName }] : []),
        ],
      },
    });

    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      return {
        success: false,
        message: 'Please verify your email before logging in',
        requiresEmailVerification: true,
        email: user.email,
      };
    }

    const tokens = await this.createTokensForUser(user.id, user.email);

    this.notificationGateway.broadcast({
      userId: user.id,
      message: 'User logged in',
    });

    return {
      success: true,
      message: 'Login successful',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        userName: user.userName,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async resendVerificationEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      return {
        message: 'Email is already verified',
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: true,
        },
      };
    }

    // Generate a new verification token (30 minutes)
    const verificationToken = this.jwtService.sign(
      { sub: user.userName, email: user.email },
      { expiresIn: '30m' },
    );

    // Replace stored token in Redis for this email
    const emailKey = `email_verification:${user.email}`;
    await this.cacheService.del(emailKey);
    await this.cacheService.set(
      emailKey,
      { token: verificationToken, isValid: true },
      TIME_EXPIRE.EMAIL_VERIFICATION,
    );

    await this.mailerService.sendEmailVerification(
      user.email,
      user.userName || 'User',
      verificationToken,
    );

    return {
      message: 'Verification email sent successfully',
      user: {
        id: user.id,
        email: user.email,
        emailVerified: false,
      },
    };
  }

  async validateUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userName: true,
        role: true,
        fullName: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async refreshAccessToken(refreshToken: string) {
    const tokenData = await this.verifyRefreshToken(refreshToken);

    // Revoke the used refresh token (token rotation for security)
    await this.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = await this.createTokensForUser(
      tokenData.userId,
      tokenData.email,
    );

    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        email: true,
        userName: true,
        fullName: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken, // New refresh token
      user,
    };
  }

  async googleLogin(googleUser: GoogleUserDto) {
    try {
      // Tìm user đã tồn tại với Google ID
      let user = await this.prisma.user.findUnique({
        where: { googleId: googleUser.googleId },
        include: {
          followers: true,
          following: true,
          posts: true,
        },
      });

      // Nếu chưa có user với Google ID, tìm theo email
      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { email: googleUser.email },
          include: {
            followers: true,
            following: true,
            posts: true,
          },
        });

        // Nếu tìm thấy user với email, cập nhật Google ID
        if (user) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleUser.googleId,
              avatar: googleUser.profilePicture || user.avatar,
              isEmailVerified: true, // Auto verify for Google users
              emailVerifiedAt: new Date(),
            },
            include: {
              followers: true,
              following: true,
              posts: true,
            },
          });
        }
      }

      // Nếu vẫn chưa có user, tạo mới
      if (!user) {
        // Tạo username unique từ email
        const baseUsername = googleUser.email.split('@')[0];
        let userName = baseUsername;
        let counter = 1;

        // Kiểm tra username đã tồn tại chưa
        while (await this.prisma.user.findUnique({ where: { userName } })) {
          userName = `${baseUsername}${counter}`;
          counter++;
        }

        user = await this.prisma.user.create({
          data: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            userName,
            fullName: googleUser.fullName,
            avatar: googleUser.profilePicture,
            isEmailVerified: true, // Auto verify for Google users
            emailVerifiedAt: new Date(),
            // No password for Google users - it's optional now
          },
          include: {
            followers: true,
            following: true,
            posts: true,
          },
        });

        // Send welcome notification for new users
        // Note: You may need to implement createNotification method in NotificationGateway
        try {
          // await this.notificationGateway.createNotification({...});
        } catch (error) {
          console.log('Failed to send welcome notification:', error);
        }
      }

      // Tạo JWT token
      const tokens = await this.createTokensForUser(user.id, user.email);

      // get relation counts using _count to avoid typing issues
      const counts = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: {
          _count: { select: { followers: true, following: true, posts: true } },
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
          fullName: user.fullName,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          followersCount: counts?._count?.followers || 0,
          followingCount: counts?._count?.following || 0,
          postsCount: counts?._count?.posts || 0,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new BadRequestException('Google authentication failed');
    }
  }

  async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const googleUser: GoogleUserDto = {
        googleId: payload.sub,
        email: payload.email!,
        fullName: payload.name!,
        firstName: payload.given_name!,
        lastName: payload.family_name!,
        profilePicture: payload.picture,
      };

      return this.googleLogin(googleUser);
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  // ===== PASSWORD RESET METHODS =====

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate password reset token (valid for 1 hour)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    // Send password reset email
    await this.mailerService.sendPasswordResetEmail({
      email: user.email,
      username: user.userName || user.fullName || 'User',
      resetToken,
    });

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Verify reset token
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check token type
    if (payload.type !== 'password-reset') {
      throw new BadRequestException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and revoke all refresh tokens for security
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all sessions to force re-login
    await this.revokeAllUserSessions(user.id);

    return {
      message:
        'Password has been reset successfully. Please log in with your new password.',
    };
  }

  // ===== TESTING / DEBUGGING =====

  async testRedis() {
    const testKey = 'test_key';
    const testValue = 'Hello, Redis!';
    await this.cacheService.set(testKey, testValue, 30000);
    return await this.cacheService.get(testKey);
  }
}
