import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { MailerService } from '../../mailer/mailer.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../dto/register.dto';
import { ROLES } from 'src/constants/roles.constant';
import { mailQueue } from 'src/queues/mail.queue';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UserManagementService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
    private jwtService: JwtService,
  ) {}

  // ===== USER REGISTRATION =====

  async registerUser(registerDto: RegisterDto) {
    const { userName, email, fullName } = registerDto;

    // Check existing user
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(userName ? [{ userName }] : [])],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        // If the email exists but is not verified, instruct user to verify
        if (!existingUser.isEmailVerified) {
          throw new BadRequestException(
            'Email already registered but not verified. Please verify your email or request a new verification email.',
          );
        }
        throw new ConflictException('Email already registered');
      }
      if (userName && existingUser.userName === userName) {
        throw new ConflictException('Username already taken');
      }
    }

    // Create user WITHOUT password (will be set during email verification)
    const newUser = await this.prisma.user.create({
      data: {
        fullName: fullName?.trim(),
        userName: userName as string,
        email,
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

    // Generate email verification token
    const verificationToken = this.generateEmailToken(
      newUser.id,
      newUser.email,
    );

    // Send verification email (using queue)
    await mailQueue.add('send-verification-email', {
      email: newUser.email,
      userName: newUser.userName,
      verificationLink: `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`,
    });

    return {
      message:
        'Registration successful. Please check your email for verification.',
      user: newUser,
    };
  }

  // ===== EMAIL VERIFICATION =====

  generateEmailToken(userId: string, email: string): string {
    const payload = {
      sub: userId,
      email,
      type: 'email-verification',
      timestamp: Date.now(),
    };
    return this.jwtService.sign(payload, { expiresIn: '24h' });
  }

  async verifyEmail(token: string, password?: string) {
    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'email-verification') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isEmailVerified) {
        return {
          message: 'Email has already been verified. You can now log in.',
        };
      }

      // Update verification status
      const updateData: any = {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      };

      // If password provided during verification, hash and update it
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      return {
        message: 'Email verified successfully. You can now log in.',
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
          fullName: user.fullName,
          isEmailVerified: true,
        },
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'Verification token has expired. Please request a new one.',
        );
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid verification token.');
      }
      throw error;
    }
  }

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return {
        message: 'If the email exists, a verification email has been sent.',
      };
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = this.generateEmailToken(user.id, user.email);

    await mailQueue.add('send-verification-email', {
      email: user.email,
      userName: user.userName,
      verificationLink: `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`,
    });

    return { message: 'Verification email sent successfully' };
  }

  // ===== PASSWORD RESET =====

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    const resetToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'password-reset',
        timestamp: Date.now(),
      },
      { expiresIn: '1h' },
    );

    await mailQueue.add('send-password-reset-email', {
      email: user.email,
      userName: user.userName,
      resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
    });

    return { message: 'Password reset link sent successfully' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    }

    try {
      const payload = this.jwtService.verify(token);

      if (payload.type !== 'password-reset') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return {
        message:
          'Password has been reset successfully. Please log in with your new password.',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException(
          'Reset token has expired. Please request a new one.',
        );
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Invalid reset token.');
      }
      throw error;
    }
  }
}
