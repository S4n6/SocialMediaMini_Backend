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
import { LoginDto } from './dto/login.dto';
import { mailQueue } from 'src/queues/mail.queue';
import { NotificationGateway } from '../notification/notification.gateway';
import { GoogleUserDto } from './dto/google-auth.dto';
import { OAuth2Client } from 'google-auth-library';
import { ROLES } from 'src/constants/roles.constant';
import { JWT } from 'src/config/jwt.config';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private notificationGateway: NotificationGateway,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  // ===== REFRESH TOKEN HELPERS =====

  private generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private async hashRefreshToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const refreshToken = this.generateRefreshToken();
    const hashedToken = await this.hashRefreshToken(refreshToken);

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

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt,
      },
    });

    return refreshToken;
  }

  private async createTokensForUser(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ userId: string; email: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Find all non-revoked, non-expired refresh tokens
    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    // Check if any stored token matches the provided one
    for (const storedToken of refreshTokens) {
      const isValid = await bcrypt.compare(refreshToken, storedToken.token);
      if (isValid) {
        // Check for suspicious activity
        await this.detectSuspiciousActivity(storedToken.userId);

        return {
          userId: storedToken.userId,
          email: storedToken.user.email,
        };
      }
    }

    // Token not found or expired - better error message
    const expiredTokens = await this.prisma.refreshToken.findMany({
      where: {
        isRevoked: false,
        expiresAt: { lte: new Date() },
      },
    });

    // Check if token exists but is expired
    for (const expiredToken of expiredTokens) {
      const isExpiredMatch = await bcrypt.compare(
        refreshToken,
        expiredToken.token,
      );
      if (isExpiredMatch) {
        // Clean up expired token
        await this.prisma.refreshToken.update({
          where: { id: expiredToken.id },
          data: { isRevoked: true },
        });
        throw new UnauthorizedException(
          'Refresh token has expired. Please log in again.',
        );
      }
    }

    throw new UnauthorizedException(
      'Invalid refresh token. Please log in again.',
    );
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: {
        isRevoked: false,
      },
    });

    for (const storedToken of refreshTokens) {
      const isValid = await bcrypt.compare(refreshToken, storedToken.token);
      if (isValid) {
        await this.prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { isRevoked: true },
        });
        break;
      }
    }
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  // Cleanup expired and revoked refresh tokens
  async cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Expired tokens
          { isRevoked: true }, // Revoked tokens
        ],
      },
    });

    return { deletedCount: result.count };
  }

  // Security: Detect and revoke suspicious token usage
  async detectSuspiciousActivity(
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    const recentTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
      },
    });

    // If too many active tokens, might be suspicious
    if (recentTokens.length > 10) {
      await this.revokeAllUserRefreshTokens(userId);
      // TODO: Send security alert email
      console.warn(
        `Suspicious activity detected for user ${userId}. All tokens revoked.`,
      );
    }
  }

  // ===== AUTH METHODS =====

  async register(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          ...(createUserDto.userName
            ? [{ userName: createUserDto.userName }]
            : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already registered');
      }
      if (
        createUserDto.userName &&
        existingUser.userName === createUserDto.userName
      ) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Generate email verification token
    const verificationToken = this.jwtService.sign(
      { sub: createUserDto.userName, email: createUserDto.email },
      { expiresIn: '1d' },
    );

    // Compose fullName and userName
    const fullName = createUserDto.fullName?.trim();

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullName,
        userName: createUserDto.userName as string,
        email: createUserDto.email,
        password: hashedPassword,
        dateOfBirth: createUserDto.dateOfBirth,
        phoneNumber: createUserDto.phoneNumber,
        avatar: createUserDto.avatar,
        bio: createUserDto.bio,
        location: createUserDto.location,
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
        'User registered successfully. Please check your email to verify your account.',
      user,
      requiresEmailVerification: true,
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

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

    const newPayload = { sub: updatedUser.id, email: updatedUser.email };
    const accessToken = this.jwtService.sign(newPayload);

    return {
      message: 'Email verified successfully',
      user: updatedUser,
      accessToken,
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

    const verificationToken = this.jwtService.sign({ email: user.email });

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

    // Revoke all refresh tokens to force re-login
    await this.revokeAllUserRefreshTokens(user.id);

    return {
      message:
        'Password has been reset successfully. Please log in with your new password.',
    };
  }
}
